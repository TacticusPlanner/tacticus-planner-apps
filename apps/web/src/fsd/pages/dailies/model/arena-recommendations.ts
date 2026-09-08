import { unitIdSchema, type UnitId } from "@workspace/game-domain"

import {
  combatPowerOf,
  contributionByUnitId,
  expandCandidatePool,
  isXpCapped,
} from "./arena-eligibility"
import {
  ARENA_MAX_TEAM_SIZE,
  ARENA_MIN_TEAM_SIZE,
  type ArenaCategory,
  type ArenaCategoryId,
  type ArenaGoalContribution,
  type ArenaMemberRationale,
  type ArenaMode,
  type ArenaPool,
  type ArenaRecommendations,
  type ArenaRosterCharacter,
  type ArenaTeamMember,
  type ArenaTeamVariant,
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

/** A seeded Fisher–Yates sample of `size` ids from `ids`. */
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

function sameUnitSet(a: readonly UnitId[], b: readonly UnitId[]): boolean {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((id) => setB.has(id))
}

type BuildContext = {
  mode: ArenaMode
  rosterIds: UnitId[]
  ownedProjectContributorIds: ReadonlySet<UnitId>
  ownedGoalContributorIds: ReadonlySet<UnitId>
  projectContributionById: Map<UnitId, ArenaGoalContribution>
  goalContributionById: Map<UnitId, ArenaGoalContribution>
  cappedById: Map<UnitId, boolean>
  combatPowerById: Map<UnitId, number>
}

/** The category's primary candidate pool. */
const PRIMARY_POOL: Record<Exclude<ArenaCategoryId, "random">, ArenaPool> = {
  "active-project": "active-project",
  "overall-goals": "overall-goals",
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

function orderCandidates(
  candidateIds: readonly UnitId[],
  isContributor: (id: UnitId) => boolean,
  ctx: BuildContext
): UnitId[] {
  const power = (id: UnitId) => ctx.combatPowerById.get(id) ?? 0
  return [...candidateIds].sort((left, right) => {
    if (ctx.mode === "xp") {
      const leftEligible = ctx.cappedById.get(left) ? 0 : 1
      const rightEligible = ctx.cappedById.get(right) ? 0 : 1
      if (leftEligible !== rightEligible) return rightEligible - leftEligible
      const leftContrib = isContributor(left) ? 1 : 0
      const rightContrib = isContributor(right) ? 1 : 0
      if (leftContrib !== rightContrib) return rightContrib - leftContrib
    }
    if (power(left) !== power(right)) return power(right) - power(left)
    return left < right ? -1 : left > right ? 1 : 0
  })
}

function toMembers(
  ids: readonly UnitId[],
  contributionOf: (id: UnitId) => ArenaGoalContribution | undefined,
  ctx: BuildContext
): ArenaTeamMember[] {
  return ids.map((id) => ({
    unitId: id,
    rationale: rationaleFor(id, contributionOf(id), ctx),
  }))
}

/**
 * Builds one goal-driven category (active-project or overall-goals). The caller has already ruled
 * out the "no basis" cases (no active plan / no active goals), so this always produces a team by
 * widening the pool as far as the full roster if necessary.
 */
function buildGoalCategory(
  id: Exclude<ArenaCategoryId, "random">,
  ctx: BuildContext
): ArenaCategory {
  const isContributor =
    id === "active-project"
      ? (unitId: UnitId) => ctx.ownedProjectContributorIds.has(unitId)
      : (unitId: UnitId) => ctx.ownedGoalContributorIds.has(unitId)

  const contributionOf =
    id === "active-project"
      ? (unitId: UnitId) =>
          ctx.projectContributionById.get(unitId) ??
          ctx.goalContributionById.get(unitId)
      : (unitId: UnitId) => ctx.goalContributionById.get(unitId)

  const expanded = expandCandidatePool({
    primaryPool: PRIMARY_POOL[id],
    rosterIds: ctx.rosterIds,
    ownedProjectContributorIds: ctx.ownedProjectContributorIds,
    ownedGoalContributorIds: ctx.ownedGoalContributorIds,
    isEligible:
      ctx.mode === "xp"
        ? (unitId: UnitId) => !ctx.cappedById.get(unitId)
        : () => true,
  })

  const ordered = orderCandidates(expanded.candidateIds, isContributor, ctx)
  const eligibleCount =
    ctx.mode === "xp"
      ? ordered.filter((unitId) => !ctx.cappedById.get(unitId)).length
      : ordered.length

  let variants: ArenaTeamVariant[]
  if (ctx.mode === "xp") {
    // Larger variants are offered only when they can be filled with XP-eligible characters — a
    // 4- or 5-character team never pulls in a capped character just to pad its size. Capped
    // characters appear only in the minimum-size team, and only when there are fewer than three
    // eligible ones (see `includedCappedCharacters`).
    const maxSize = Math.min(
      ordered.length,
      Math.max(ARENA_MIN_TEAM_SIZE, eligibleCount)
    )
    variants = [
      ARENA_MIN_TEAM_SIZE,
      ARENA_MIN_TEAM_SIZE + 1,
      ARENA_MAX_TEAM_SIZE,
    ]
      .filter((size) => size <= maxSize)
      .map((size) => ({
        size,
        isPrimary: size === ARENA_MIN_TEAM_SIZE,
        members: toMembers(ordered.slice(0, size), contributionOf, ctx),
      }))
  } else {
    const size = Math.min(ARENA_MAX_TEAM_SIZE, ordered.length)
    variants = [
      {
        size,
        isPrimary: true,
        members: toMembers(ordered.slice(0, size), contributionOf, ctx),
      },
    ]
  }

  return {
    id,
    poolUsed: expanded.poolUsed,
    broadened: expanded.broadened,
    includedCappedCharacters:
      ctx.mode === "xp" && eligibleCount < ARENA_MIN_TEAM_SIZE,
    variants,
  }
}

function buildRandomCategory(
  input: BuildArenaRecommendationsInput,
  ctx: BuildContext
): ArenaCategory {
  const size = Math.min(ARENA_MAX_TEAM_SIZE, ctx.rosterIds.length)
  let picked = seededSample(ctx.rosterIds, size, input.randomSeed)
  // `randomSeed` increments by one per regenerate, so `randomSeed - 1` is the team the previous
  // press produced. When the roster is large enough for the result to differ, make sure it does.
  if (input.randomSeed > 0 && ctx.rosterIds.length > size) {
    const previous = seededSample(ctx.rosterIds, size, input.randomSeed - 1)
    if (sameUnitSet(picked, previous)) {
      picked = seededSample(ctx.rosterIds, size, input.randomSeed + 1)
    }
  }
  return {
    id: "random",
    poolUsed: "full-roster",
    broadened: false,
    includedCappedCharacters: false,
    variants: [
      {
        size: picked.length,
        isPrimary: true,
        members: picked.map((id) => ({
          unitId: id,
          rationale: { kind: "random" },
        })),
      },
    ],
  }
}

/**
 * Builds the Arena recommendations for every category from already-derived contributor sets, the
 * owned roster, and the selected mode. The caller guarantees at least `ARENA_MIN_TEAM_SIZE` owned
 * characters (fewer is the page-level "not enough characters" state, handled upstream).
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
    rosterIds,
    ownedProjectContributorIds: new Set(projectContributionById.keys()),
    ownedGoalContributorIds: new Set(goalContributionById.keys()),
    projectContributionById,
    goalContributionById,
    cappedById: new Map(input.roster.map((c) => [c.unitId, isXpCapped(c)])),
    combatPowerById: new Map(
      input.roster.map((c) => [c.unitId, combatPowerOf(c)])
    ),
  }

  const activeProjectCategory: ArenaCategory = !input.hasActiveProject
    ? {
        id: "active-project",
        poolUsed: "active-project",
        broadened: false,
        includedCappedCharacters: false,
        emptyReason: "no-active-project",
        variants: [],
      }
    : buildGoalCategory("active-project", ctx)

  const overallGoalsCategory: ArenaCategory =
    ctx.ownedGoalContributorIds.size === 0
      ? {
          id: "overall-goals",
          poolUsed: "overall-goals",
          broadened: false,
          includedCappedCharacters: false,
          emptyReason: "no-active-goals",
          variants: [],
        }
      : buildGoalCategory("overall-goals", ctx)

  return {
    categories: [
      activeProjectCategory,
      overallGoalsCategory,
      buildRandomCategory(input, ctx),
    ],
  }
}
