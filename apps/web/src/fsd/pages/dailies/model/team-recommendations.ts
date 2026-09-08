import { progressionRarity, type UnitId } from "@workspace/game-domain"

import {
  combatPowerOf,
  expandCandidatePool,
  FULL_ROSTER_POOL_ID,
  isXpCapped,
} from "./team-eligibility"
import {
  MIN_TEAM_SIZE,
  type BuildTeamRecommendationsInput,
  type TeamCategory,
  type TeamMember,
  type TeamMemberRationale,
  type TeamMode,
  type TeamPoolSpec,
  type TeamPreferences,
  type TeamRecommendations,
  type TeamRosterCharacter,
} from "./team-recommendations.types"

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
  mode: TeamMode
  requestedSize: number
  rosterIds: UnitId[]
  characterById: Map<UnitId, TeamRosterCharacter>
  /** Priority pools (roster-filtered), highest first — the implicit full-roster pool is not here. */
  pools: readonly TeamPoolSpec[]
  /** Higher number = higher-priority pool; absent when the character is in no configured pool. */
  poolRankById: Map<UnitId, number>
  cappedById: Map<UnitId, boolean>
  combatPowerById: Map<UnitId, number>
  preferences: TeamPreferences
}

/** Drops a preference field that no owned character satisfies, so an unsatisfiable preference is
 * ignored entirely (the team is drawn exactly as if it were unset) rather than driving a pointless
 * pool widening. */
function narrowPreferences(
  roster: readonly TeamRosterCharacter[],
  preferences: TeamPreferences
): TeamPreferences {
  const kept: TeamPreferences = {}
  if (
    preferences.trait &&
    roster.some((character) => character.traits.includes(preferences.trait!))
  ) {
    kept.trait = preferences.trait
  }
  if (
    preferences.damageType &&
    roster.some((character) =>
      character.damageTypes.includes(preferences.damageType!)
    )
  ) {
    kept.damageType = preferences.damageType
  }
  return kept
}

function matchesPreferences(id: UnitId, ctx: BuildContext): boolean {
  const { trait, damageType } = ctx.preferences
  if (!trait && !damageType) return true
  const character = ctx.characterById.get(id)
  if (!character) return false
  return (
    (!trait || character.traits.includes(trait)) &&
    (!damageType || character.damageTypes.includes(damageType))
  )
}

/** Mode eligibility only — XP-uncapped in XP Mode, everyone in Power Mode. */
function modeEligible(id: UnitId, ctx: BuildContext): boolean {
  return ctx.mode === "xp" ? !ctx.cappedById.get(id) : true
}

/** The combined candidate-eligibility predicate: mode eligibility AND every active preference.
 * Drives both pool widening and the ordering's top tier. */
function isEligible(id: UnitId, ctx: BuildContext): boolean {
  return modeEligible(id, ctx) && matchesPreferences(id, ctx)
}

function rationaleFor(id: UnitId, ctx: BuildContext): TeamMemberRationale {
  for (const pool of ctx.pools) {
    if (pool.unitIds.has(id)) {
      const rationale = pool.rationaleFor(id)
      if (rationale) return rationale
    }
  }
  if (ctx.mode === "power") {
    return { kind: "strength", combatPower: ctx.combatPowerById.get(id) ?? 0 }
  }
  return { kind: "minimum-size" }
}

function memberOf(
  id: UnitId,
  rationale: TeamMemberRationale,
  ctx: BuildContext,
  locked: boolean
): TeamMember {
  const character = ctx.characterById.get(id)!
  // `ctx.preferences` is already narrowed, so an unsatisfiable preference is absent here and never
  // produces a marker.
  const { trait, damageType } = ctx.preferences
  return {
    unitId: id,
    rank: character.rank,
    rarity: progressionRarity(character.progression),
    locked,
    rationale,
    ...(trait && character.traits.includes(trait)
      ? { matchedTrait: trait }
      : {}),
    ...(damageType && character.damageTypes.includes(damageType)
      ? { matchedDamageType: damageType }
      : {}),
  }
}

function orderCandidates(
  candidateIds: readonly UnitId[],
  ctx: BuildContext
): UnitId[] {
  const power = (id: UnitId) => ctx.combatPowerById.get(id) ?? 0
  return [...candidateIds].sort((left, right) => {
    const leftEligible = isEligible(left, ctx) ? 1 : 0
    const rightEligible = isEligible(right, ctx) ? 1 : 0
    if (leftEligible !== rightEligible) return rightEligible - leftEligible
    if (ctx.mode === "xp") {
      const leftPool = ctx.poolRankById.get(left) ?? 0
      const rightPool = ctx.poolRankById.get(right) ?? 0
      if (leftPool !== rightPool) return rightPool - leftPool
    }
    if (power(left) !== power(right)) return power(right) - power(left)
    return left < right ? -1 : left > right ? 1 : 0
  })
}

/**
 * Builds the single Plan Team. It widens from the highest-priority configured pool through the
 * full roster while fewer than `MIN_TEAM_SIZE` eligible characters are available, then delivers the
 * requested size (clamped down when the pool cannot fill it). Preference-matching characters sort
 * ahead of the rest, so a satisfiable preference restricts the team while an under-supplied one
 * only widens the pool and a top-up from non-matching characters keeps the delivered size.
 */
function buildPlanTeam(ctx: BuildContext): TeamCategory {
  const expanded = expandCandidatePool({
    rosterIds: ctx.rosterIds,
    pools: ctx.pools,
    isEligible: (id) => isEligible(id, ctx),
    // Widen past the three-character minimum to fill the requested size from the wider roster when
    // the priority pools fall short — the roster fillers sort after the pool members.
    targetEligible: ctx.requestedSize,
  })

  const ordered = orderCandidates(expanded.candidateIds, ctx)

  // XP-eligibility is a mode concern — the capped note and the size ceiling ignore preferences.
  const xpEligibleCount =
    ctx.mode === "xp"
      ? ordered.filter((id) => !ctx.cappedById.get(id)).length
      : ordered.length

  // In XP Mode a team is never padded past three with capped characters, so the size ceiling is the
  // XP-eligible count (but at least three, since capped fillers can reach the minimum).
  const sizeCeiling =
    ctx.mode === "xp"
      ? Math.min(ordered.length, Math.max(MIN_TEAM_SIZE, xpEligibleCount))
      : ordered.length
  const size = Math.min(ctx.requestedSize, sizeCeiling)
  const members = ordered
    .slice(0, size)
    .map((id) => memberOf(id, rationaleFor(id, ctx), ctx, false))

  return {
    id: "plan",
    poolUsed: expanded.poolUsed,
    broadened: expanded.broadened,
    includedCappedCharacters:
      ctx.mode === "xp" && xpEligibleCount < MIN_TEAM_SIZE,
    requestedSize: ctx.requestedSize,
    deliveredSize: members.length,
    members,
  }
}

/**
 * Builds the Random Team. The draw pool is mode-aware — XP-eligible characters in XP Mode (topped
 * up with capped ones only when too few are eligible), the full roster in Power Mode with the draw
 * weighted by combat power — then narrowed to preference matches, falling back to the un-narrowed
 * pool when fewer than the team size match. Locked characters are pinned first and kept even when a
 * filter would drop them; only the unlocked slots are (re-)drawn from `randomSeed`.
 */
function buildRandomTeam(
  input: BuildTeamRecommendationsInput,
  ctx: BuildContext
): TeamCategory {
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
  const matching = pool.filter((id) => matchesPreferences(id, ctx))
  if (matching.length >= size) pool = matching

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
    poolUsed: FULL_ROSTER_POOL_ID,
    broadened: false,
    includedCappedCharacters: false,
    requestedSize: input.teamSize,
    deliveredSize: members.length,
    members,
  }
}

/**
 * Builds a Plan Team and a Random Team from a per-page configuration: a mode-eligible roster, an
 * ordered priority-pool list, the requested size, the preference filters, the lock set and the
 * random seed. Game-mode-agnostic — Arena, Salvage Run and Onslaught each pass their own config.
 * The caller guarantees at least `MIN_TEAM_SIZE` characters in `roster`.
 */
export function buildTeamRecommendations(
  input: BuildTeamRecommendationsInput
): TeamRecommendations {
  const rosterIds = input.roster.map((character) => character.unitId)
  const rosterIdSet = new Set(rosterIds)

  const pools = input.pools.map((pool) => ({
    ...pool,
    unitIds: new Set([...pool.unitIds].filter((id) => rosterIdSet.has(id))),
  }))

  const poolRankById = new Map<UnitId, number>()
  for (const id of rosterIds) {
    const index = pools.findIndex((pool) => pool.unitIds.has(id))
    if (index !== -1) poolRankById.set(id, pools.length - index)
  }

  const ctx: BuildContext = {
    mode: input.mode,
    requestedSize: input.teamSize,
    rosterIds,
    characterById: new Map(input.roster.map((c) => [c.unitId, c])),
    pools,
    poolRankById,
    cappedById: new Map(input.roster.map((c) => [c.unitId, isXpCapped(c)])),
    combatPowerById: new Map(
      input.roster.map((c) => [c.unitId, combatPowerOf(c)])
    ),
    preferences: narrowPreferences(input.roster, input.preferences),
  }

  return {
    categories: [buildPlanTeam(ctx), buildRandomTeam(input, ctx)],
  }
}
