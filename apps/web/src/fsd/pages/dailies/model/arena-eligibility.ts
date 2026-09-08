import {
  characterCombatPower,
  levelCapForProgression,
  type UnitId,
} from "@workspace/game-domain"

import {
  ARENA_MIN_TEAM_SIZE,
  ARENA_POOL_ORDER,
  type ArenaGoalContribution,
  type ArenaPool,
  type ArenaRosterCharacter,
} from "./arena-recommendations.types"

/** A character can no longer earn XP once its level reaches the cap for its current progression
 * tier's rarity — it must Ascend into the next tier to raise the cap. */
export function isXpCapped(character: ArenaRosterCharacter): boolean {
  return character.xpLevel >= levelCapForProgression(character.progression)
}

/** This character's combat-power estimate (see `@workspace/game-domain`). Roster characters are
 * always owned, so `unlocked` is always true here. */
export function combatPowerOf(character: ArenaRosterCharacter): number {
  return characterCombatPower({
    unlocked: true,
    rank: character.rank,
    progression: character.progression,
    appliedUpgradeCount: character.appliedUpgradeCount,
    activeAbilityLevel: character.activeAbilityLevel,
    passiveAbilityLevel: character.passiveAbilityLevel,
  })
}

/** First contribution per unit id, in input order — a unit targeted by several active goals keeps
 * the first for its rationale. */
export function contributionByUnitId(
  contributions: readonly ArenaGoalContribution[]
): Map<UnitId, ArenaGoalContribution> {
  const map = new Map<UnitId, ArenaGoalContribution>()
  for (const contribution of contributions) {
    if (!map.has(contribution.unitId))
      map.set(contribution.unitId, contribution)
  }
  return map
}

type PoolParams = {
  rosterIds: readonly UnitId[]
  ownedProjectContributorIds: ReadonlySet<UnitId>
  ownedGoalContributorIds: ReadonlySet<UnitId>
}

/** Owned unit ids belonging to one pool, in roster order. */
export function poolUnitIds(pool: ArenaPool, params: PoolParams): UnitId[] {
  switch (pool) {
    case "active-project":
      return params.rosterIds.filter((id) =>
        params.ownedProjectContributorIds.has(id)
      )
    case "overall-goals":
      return params.rosterIds.filter((id) =>
        params.ownedGoalContributorIds.has(id)
      )
    case "full-roster":
      return [...params.rosterIds]
  }
}

export type ExpandedPool = {
  poolUsed: ArenaPool
  poolIndex: number
  broadened: boolean
  candidateIds: UnitId[]
}

/**
 * Widens the candidate set from `primaryPool` down `ARENA_POOL_ORDER` while it holds fewer than
 * `ARENA_MIN_TEAM_SIZE` characters the `isEligible` predicate accepts. Returns the union of every
 * pool visited (roster order, de-duplicated) and the widest pool reached.
 */
export function expandCandidatePool(
  params: PoolParams & {
    primaryPool: ArenaPool
    isEligible: (id: UnitId) => boolean
  }
): ExpandedPool {
  const primaryIndex = ARENA_POOL_ORDER.indexOf(params.primaryPool)
  const primaryPoolIds = new Set(poolUnitIds(params.primaryPool, params))
  const seen = new Set<UnitId>()
  const candidateIds: UnitId[] = []
  let poolIndex = primaryIndex

  for (let index = primaryIndex; index < ARENA_POOL_ORDER.length; index++) {
    poolIndex = index
    for (const id of poolUnitIds(ARENA_POOL_ORDER[index], params)) {
      if (!seen.has(id)) {
        seen.add(id)
        candidateIds.push(id)
      }
    }
    if (candidateIds.filter(params.isEligible).length >= ARENA_MIN_TEAM_SIZE) {
      break
    }
  }

  // "Broadened" means the final candidate set actually pulled in a character from outside the
  // category's primary pool — not merely that the widening loop ran to the end (it can, without
  // adding anyone, when the primary pool's own members are simply short on eligible characters).
  const broadened = candidateIds.some((id) => !primaryPoolIds.has(id))
  return {
    poolUsed: broadened ? ARENA_POOL_ORDER[poolIndex] : params.primaryPool,
    poolIndex,
    broadened,
    candidateIds,
  }
}
