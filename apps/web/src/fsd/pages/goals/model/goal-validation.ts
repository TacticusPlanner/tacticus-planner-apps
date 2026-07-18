import {
  lastProgression,
  lastRank,
  progressionIndex,
  progressionRarity,
  rankIndex,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

// Mirrors the backend's `AbilityCaps` table (`GoalTargetValidationService.cs`) — the ability-level
// ceiling for a unit's current rarity tier. An Ability goal can never target above this until the
// unit is Ascended further, which is exactly when "already at max" should disable the toggle.
const abilityCapByRarity: Record<Rarity, number> = {
  Common: 8,
  Uncommon: 17,
  Rare: 26,
  Epic: 35,
  Legendary: 50,
  Mythic: 60,
}

/** True once a unit has climbed its entire rank ladder — a Rank goal (and, for a Character, an
 * Upgrade goal's rank-range picker) has nowhere left to target. */
export function isAtMaxRank(currentRank: Rank | undefined): boolean {
  return !!currentRank && rankIndex(currentRank) >= rankIndex(lastRank)
}

/** True once a unit has reached the last Ascension step — an Ascension goal has nowhere left to
 * target. */
export function isAtMaxProgression(
  currentProgression: Progression | undefined
): boolean {
  return (
    !!currentProgression &&
    progressionIndex(currentProgression) >= progressionIndex(lastProgression)
  )
}

/** True once both ability tracks are already at the level cap for the unit's current rarity — an
 * Ability goal has nowhere left to target until the unit is Ascended into a higher rarity tier
 * (which raises the cap). Undefined progression (no synced/prefill data yet) reads as not-maxed. */
export function isAtMaxAbility(
  currentProgression: Progression | undefined,
  currentActiveAbility: number,
  currentPassiveAbility: number
): boolean {
  if (!currentProgression) return false
  const cap = abilityCapByRarity[progressionRarity(currentProgression)]
  return currentActiveAbility >= cap && currentPassiveAbility >= cap
}

export type GoalValidationIssue =
  | "alreadyUnlocked"
  | "rankAlreadyReached"
  | "progressionAlreadyReached"
  | "abilityRange"
  | "abilityAlreadyReached"

export function getGoalValidationIssue(params: {
  hasEntityId: boolean
  enabledTypes: ReadonlySet<GoalKind>
  isOwned: boolean
  currentRank: Rank | undefined
  rankEnd: Rank
  currentProgression: Progression | undefined
  progressionEnd: Progression
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  currentActiveAbility: number
  currentPassiveAbility: number
}): GoalValidationIssue | null {
  if (!params.hasEntityId) return null
  if (params.enabledTypes.has("Unlock") && params.isOwned) {
    return "alreadyUnlocked"
  }
  if (
    params.enabledTypes.has("Rank") &&
    params.currentRank &&
    rankIndex(params.rankEnd) <= rankIndex(params.currentRank)
  ) {
    return "rankAlreadyReached"
  }
  if (
    params.enabledTypes.has("Ascension") &&
    params.currentProgression &&
    progressionIndex(params.progressionEnd) <=
      progressionIndex(params.currentProgression)
  ) {
    return "progressionAlreadyReached"
  }
  if (!params.enabledTypes.has("Ability")) return null
  const validRange =
    params.abilityActiveEnd >= params.abilityActiveStart &&
    params.abilityPassiveEnd >= params.abilityPassiveStart &&
    (params.abilityActiveEnd > params.abilityActiveStart ||
      params.abilityPassiveEnd > params.abilityPassiveStart)
  if (!validRange) return "abilityRange"
  if (
    params.abilityActiveEnd <= params.currentActiveAbility &&
    params.abilityPassiveEnd <= params.currentPassiveAbility
  ) {
    return "abilityAlreadyReached"
  }
  return null
}
