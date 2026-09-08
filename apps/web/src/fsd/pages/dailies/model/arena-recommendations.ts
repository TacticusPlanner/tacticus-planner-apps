import {
  progressionRarity,
  unitIdSchema,
  type UnitId,
} from "@workspace/game-domain"

import {
  combatPowerOf,
  contributionByUnitId,
  expandCandidatePool,
  isXpCapped,
} from "./arena-eligibility"
import {
  ARENA_MIN_TEAM_SIZE,
  type ArenaCategory,
  type ArenaGoalContribution,
  type ArenaMemberRationale,
  type ArenaMode,
  type ArenaRecommendations,
  type ArenaRosterCharacter,
  type ArenaTeamMember,
  type BuildArenaRecommendationsInput,
  type RawGoal,
  type RawRosterCharacter,
} from "./arena-recommendations.types"

/** Maps a synced roster record to the engine's character shape. */
export function mapRosterCharacter(
  record: RawRosterCharacter
): ArenaRosterCharacter {
  return {
    unitId: record.unitId,
    rank: record.rank,
    progression: record.progressionIndex,
    xpLevel: record.xpLevel,
    appliedUpgradeCount: new Set(record.appliedUpgradeSlots).size,
    activeAbilityLevel: record.abilities[0]?.level ?? 1,
    passiveAbilityLevel: record.abilities[1]?.level ?? 1,
  }
}

/** Keeps only the active-status character goals and turns them into contributions. `projectId` is
 * stamped on every result when the goals came from a project's membership list. */
export function collectContributions(
  goals: readonly RawGoal[],
  projectId?: string
): ArenaGoalContribution[] {
  const contributions: ArenaGoalContribution[] = []
  for (const goal of goals) {
    if (goal.status !== "Active" || goal.entityType !== "Character") continue
    const parsed = unitIdSchema.safeParse(goal.entityId)
    if (!parsed.success) continue
    contributions.push({
      unitId: parsed.data,
      goalId: goal.goalId,
      ...(projectId ? { projectId } : {}),
    })
  }
  return contributions
}

/** Deterministic PRNG (mulberry32) — a fixed `randomSeed` always yields the same random team. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A seeded Fisher–Yates sample of `size` ids from `ids` (uniform). */
function seededSample(
  ids: readonly UnitId[],
  size: number,
  seed: number
): UnitId[] {
  const rng = mulberry32(seed)
  const shuffled = [...ids]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, size)
}

/**
 * A seeded sample of `size` ids drawn without replacement, each pick weighted by `weightOf` (a
 * roulette-wheel draw). Higher-weight ids are proportionally more likely, but no id is guaranteed
 * or excluded — used for Power Mode's Random Team so the draw favors stronger characters while
 * staying random. Deterministic for a given `seed`.
 */
function seededWeightedSample(
  ids: readonly UnitId[],
  weightOf: (id: UnitId) => number,
  size: number,
  seed: number
): UnitId[] {
  const rng = mulberry32(seed)
  const pool = ids.map((id) => ({ id, weight: Math.max(weightOf(id), 1e-9) }))
  const take = Math.min(size, pool.length)
  const out: UnitId[] = []
  for (let n = 0; n < take; n++) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
    let threshold = rng() * total
    let index = 0
    for (; index < pool.length - 1; index++) {
      threshold -= pool[index].weight
      if (threshold <= 0) break
    }
    out.push(pool[index].id)
    pool.splice(index, 1)
  }
  return out
}

function sameUnitSet(a: readonly UnitId[], b: readonly UnitId[]): boolean {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((id) => setB.has(id))
}

/**
 * The random fill to display for a given `seed` (`randomSeed`, which increments by one per
 * Regenerate). Walks the whole seed chain `0..seed` so each step is compared against the fill the
 * *previous* step actually displayed — not `fill(seed - 1)`, which diverges from the shown fill as
 * soon as a collision is skipped. On a collision it advances to off-sequence seeds (never a value a
 * later Regenerate lands on naturally), so consecutive Regenerates always differ across the
 * unlocked slots whenever there are more free candidates than free slots. `fill` is uniform in XP
 * Mode and power-weighted in Power Mode.
 */
function randomTeamForSeed(
  ids: readonly UnitId[],
  size: number,
  seed: number,
  fill: (seed: number) => UnitId[]
): UnitId[] {
  const canDiffer = ids.length > size
  let shown = fill(0)
  for (let step = 1; step <= seed; step++) {
    let team = fill(step)
    for (
      let bump = 1;
      canDiffer && bump <= ids.length && sameUnitSet(team, shown);
      bump++
    ) {
      team = fill((step + 1) * 100_003 + bump)
    }
    shown = team
  }
  return shown
}

type BuildContext = {
  mode: ArenaMode
  requestedSize: number
  rosterIds: UnitId[]
  characterById: Map<UnitId, ArenaRosterCharacter>
  ownedProjectContributorIds: ReadonlySet<UnitId>
  ownedGoalContributorIds: ReadonlySet<UnitId>
  projectContributionById: Map<UnitId, ArenaGoalContribution>
  goalContributionById: Map<UnitId, ArenaGoalContribution>
  cappedById: Map<UnitId, boolean>
  combatPowerById: Map<UnitId, number>
}

function rationaleFor(
  id: UnitId,
  contribution: ArenaGoalContribution | undefined,
  ctx: BuildContext
): ArenaMemberRationale {
  if (contribution) {
    return {
      kind: "goal",
      goalId: contribution.goalId,
      ...(contribution.projectId ? { projectId: contribution.projectId } : {}),
    }
  }
  if (ctx.mode === "power") {
    return { kind: "strength", combatPower: ctx.combatPowerById.get(id) ?? 0 }
  }
  return { kind: "minimum-size" }
}

function memberOf(
  id: UnitId,
  rationale: ArenaMemberRationale,
  ctx: BuildContext,
  locked: boolean
): ArenaTeamMember {
  const character = ctx.characterById.get(id)!
  return {
    unitId: id,
    rank: character.rank,
    rarity: progressionRarity(character.progression),
    locked,
    rationale,
  }
}

/** Contributor priority for the Plan Team: 2 = selected-project contributor, 1 = any other
 * active-goal contributor, 0 = neither. */
function contributorRankOf(id: UnitId, ctx: BuildContext): 0 | 1 | 2 {
  if (ctx.ownedProjectContributorIds.has(id)) return 2
  if (ctx.ownedGoalContributorIds.has(id)) return 1
  return 0
}

function orderCandidates(
  candidateIds: readonly UnitId[],
  ctx: BuildContext
): UnitId[] {
  const power = (id: UnitId) => ctx.combatPowerById.get(id) ?? 0
  return [...candidateIds].sort((left, right) => {
    if (ctx.mode === "xp") {
      const leftEligible = ctx.cappedById.get(left) ? 0 : 1
      const rightEligible = ctx.cappedById.get(right) ? 0 : 1
      if (leftEligible !== rightEligible) return rightEligible - leftEligible
      const leftContrib = contributorRankOf(left, ctx)
      const rightContrib = contributorRankOf(right, ctx)
      if (leftContrib !== rightContrib) return rightContrib - leftContrib
    }
    if (power(left) !== power(right)) return power(right) - power(left)
    return left < right ? -1 : left > right ? 1 : 0
  })
}

/**
 * Builds the single Plan Team category. Its primary pool is the selected project's owned
 * contributors, widening through overall goals to the full roster while fewer than
 * `ARENA_MIN_TEAM_SIZE` eligible characters are available — so it always produces a team for a
 * player with at least three owned characters. The team is delivered at the page-level requested
 * size, clamped down when the pool cannot fill it with eligible characters.
 */
function buildPlanCategory(ctx: BuildContext): ArenaCategory {
  const contributionOf = (id: UnitId) =>
    ctx.projectContributionById.get(id) ?? ctx.goalContributionById.get(id)

  const expanded = expandCandidatePool({
    primaryPool: "active-project",
    rosterIds: ctx.rosterIds,
    ownedProjectContributorIds: ctx.ownedProjectContributorIds,
    ownedGoalContributorIds: ctx.ownedGoalContributorIds,
    isEligible:
      ctx.mode === "xp" ? (id: UnitId) => !ctx.cappedById.get(id) : () => true,
  })

  const ordered = orderCandidates(expanded.candidateIds, ctx)
  const eligibleCount =
    ctx.mode === "xp"
      ? ordered.filter((id) => !ctx.cappedById.get(id)).length
      : ordered.length

  // In XP Mode a team is never padded past three with capped characters, so the size ceiling is the
  // eligible count (but at least three, since capped fillers can reach the minimum).
  const sizeCeiling =
    ctx.mode === "xp"
      ? Math.min(ordered.length, Math.max(ARENA_MIN_TEAM_SIZE, eligibleCount))
      : ordered.length
  const size = Math.min(ctx.requestedSize, sizeCeiling)
  const members = ordered
    .slice(0, size)
    .map((id) =>
      memberOf(id, rationaleFor(id, contributionOf(id), ctx), ctx, false)
    )

  return {
    id: "plan",
    poolUsed: expanded.poolUsed,
    broadened: expanded.broadened,
    includedCappedCharacters:
      ctx.mode === "xp" && eligibleCount < ARENA_MIN_TEAM_SIZE,
    requestedSize: ctx.requestedSize,
    deliveredSize: members.length,
    members,
  }
}

/**
 * Builds the Random Team. The draw pool is mode-aware — XP-eligible characters in XP Mode (topped
 * up with capped ones only when too few are eligible), the full roster in Power Mode with the draw
 * weighted by combat power. Locked characters are pinned first and kept even when the mode filter
 * would drop them; only the unlocked slots are (re-)drawn from `randomSeed`.
 */
function buildRandomCategory(
  input: BuildArenaRecommendationsInput,
  ctx: BuildContext
): ArenaCategory {
  const size = Math.min(input.teamSize, ctx.rosterIds.length)
  const lockedRequested = new Set(input.lockedRandomUnitIds)
  const locked = ctx.rosterIds
    .filter((id) => lockedRequested.has(id))
    .slice(0, size)
  const lockedSet = new Set(locked)
  const freeSlots = size - locked.length

  let pool: UnitId[]
  if (ctx.mode === "xp") {
    const eligible = ctx.rosterIds.filter((id) => !ctx.cappedById.get(id))
    pool = eligible.length >= size ? eligible : [...ctx.rosterIds]
  } else {
    pool = [...ctx.rosterIds]
  }
  const freeCandidates = pool.filter((id) => !lockedSet.has(id))

  const fill = (seed: number): UnitId[] =>
    ctx.mode === "power"
      ? seededWeightedSample(
          freeCandidates,
          (id) => ctx.combatPowerById.get(id) ?? 1,
          freeSlots,
          seed
        )
      : seededSample(freeCandidates, freeSlots, seed)

  const filled =
    freeSlots <= 0
      ? []
      : randomTeamForSeed(freeCandidates, freeSlots, input.randomSeed, fill)

  const members = [...locked, ...filled].map((id) =>
    memberOf(id, { kind: "random" }, ctx, lockedSet.has(id))
  )

  return {
    id: "random",
    poolUsed: "full-roster",
    broadened: false,
    includedCappedCharacters: false,
    requestedSize: input.teamSize,
    deliveredSize: members.length,
    members,
  }
}

/**
 * Builds the Arena recommendations — one Plan Team and one Random Team — from the owned roster, the
 * selected project's and all active goals' contributions, the selected mode, and the requested
 * team size. The caller guarantees at least `ARENA_MIN_TEAM_SIZE` owned characters (fewer is the
 * page-level "not enough characters" state, handled upstream).
 */
export function buildArenaRecommendations(
  input: BuildArenaRecommendationsInput
): ArenaRecommendations {
  const rosterIds = input.roster.map((character) => character.unitId)
  const rosterIdSet = new Set(rosterIds)

  const projectContributionById = contributionByUnitId(
    input.activeProjectContributions.filter((c) => rosterIdSet.has(c.unitId))
  )
  const goalContributionById = contributionByUnitId(
    input.activeGoalContributions.filter((c) => rosterIdSet.has(c.unitId))
  )

  const ctx: BuildContext = {
    mode: input.mode,
    requestedSize: input.teamSize,
    rosterIds,
    characterById: new Map(input.roster.map((c) => [c.unitId, c])),
    ownedProjectContributorIds: new Set(projectContributionById.keys()),
    ownedGoalContributorIds: new Set(goalContributionById.keys()),
    projectContributionById,
    goalContributionById,
    cappedById: new Map(input.roster.map((c) => [c.unitId, isXpCapped(c)])),
    combatPowerById: new Map(
      input.roster.map((c) => [c.unitId, combatPowerOf(c)])
    ),
  }

  return {
    categories: [buildPlanCategory(ctx), buildRandomCategory(input, ctx)],
  }
}
