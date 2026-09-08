import {
  characterCombatPower,
  levelCapForProgression,
  type UnitId,
} from "@workspace/game-domain"

import {
  MIN_TEAM_SIZE,
  type TeamPoolSpec,
  type TeamRosterCharacter,
} from "./team-recommendations.types"

/** The id of the implicit lowest-priority pool the engine always widens into last. */
export const FULL_ROSTER_POOL_ID = "full-roster"

/** A character can no longer earn XP once its level reaches the cap for its current progression
 * tier's rarity — it must Ascend into the next tier to raise the cap. */
export function isXpCapped(character: TeamRosterCharacter): boolean {
  return character.xpLevel >= levelCapForProgression(character.progression)
}

/** This character's combat-power estimate (see `@workspace/game-domain`). Roster characters are
 * always owned, so `unlocked` is always true here. */
export function combatPowerOf(character: TeamRosterCharacter): number {
  return characterCombatPower({
    unlocked: true,
    rank: character.rank,
    progression: character.progression,
    appliedUpgradeCount: character.appliedUpgradeCount,
    activeAbilityLevel: character.activeAbilityLevel,
    passiveAbilityLevel: character.passiveAbilityLevel,
  })
}

export type ExpandedPool = {
  /** The id of the widest pool reached, or the primary pool's id when nothing outside it was
   * pulled in. */
  poolUsed: string
  poolIndex: number
  broadened: boolean
  candidateIds: UnitId[]
}

/**
 * Widens the candidate set from the highest-priority pool down the configured `pools` list — and
 * finally into the implicit full-roster pool — while it holds fewer than `MIN_TEAM_SIZE`
 * characters the `isEligible` predicate accepts. Returns the union of every pool visited (roster
 * order, de-duplicated) and the widest pool reached.
 */
export function expandCandidatePool(params: {
  rosterIds: readonly UnitId[]
  /** Priority pools, highest first — WITHOUT the implicit full-roster pool, which is appended
   * here. */
  pools: readonly TeamPoolSpec[]
  isEligible: (id: UnitId) => boolean
}): ExpandedPool {
  const orderedPools: { id: string; unitIds: ReadonlySet<UnitId> }[] = [
    ...params.pools,
    { id: FULL_ROSTER_POOL_ID, unitIds: new Set(params.rosterIds) },
  ]
  const primaryPoolIds = new Set(
    params.rosterIds.filter((id) => orderedPools[0].unitIds.has(id))
  )

  const seen = new Set<UnitId>()
  const candidateIds: UnitId[] = []
  let poolIndex = 0

  for (let index = 0; index < orderedPools.length; index++) {
    poolIndex = index
    for (const id of params.rosterIds) {
      if (orderedPools[index].unitIds.has(id) && !seen.has(id)) {
        seen.add(id)
        candidateIds.push(id)
      }
    }
    if (candidateIds.filter(params.isEligible).length >= MIN_TEAM_SIZE) break
  }

  // "Broadened" means the final candidate set actually pulled in a character from outside the
  // primary pool — not merely that the widening loop ran on (it can, without adding anyone, when
  // the primary pool's own members are simply short on eligible characters).
  const broadened = candidateIds.some((id) => !primaryPoolIds.has(id))
  return {
    poolUsed: broadened ? orderedPools[poolIndex].id : orderedPools[0].id,
    poolIndex,
    broadened,
    candidateIds,
  }
}
