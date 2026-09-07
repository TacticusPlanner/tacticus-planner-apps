import {
  abilityCapByRarity,
  lastProgression,
  lastRank,
  progressionIndex,
  progressionRarity,
  rankIndex,
  rarityOrder,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

/** The rarity ability caps (see `abilityCapByRarity` in `@workspace/game-domain`, which mirrors
 * the backend's `AbilityCaps` table) paired with their rarity tier, in rarity order — used to
 * label the Ability goal's target range with rarity-tier section headers and to map a target
 * level back to the tier that first permits it. */
export const abilityLevelsByRarity: readonly {
  rarity: Rarity
  level: number
}[] = rarityOrder.map((rarity) => ({
  rarity,
  level: abilityCapByRarity[rarity],
}))

/** The highest character level a Level goal can ever target (Adamantine2, the frontend's current
 * rank-ladder ceiling — see `rankToLevel` in rank-additional-target.ts). Character-only; MoWs also
 * carry a synced `xpLevel` but Level goals aren't offered for them yet. */
export const MAX_CHARACTER_LEVEL = 60

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

/** True once a character has reached `MAX_CHARACTER_LEVEL` — a Level goal has nowhere left to
 * target. Undefined `xpLevel` (no synced/prefill data yet) reads as not-maxed. */
export function isAtMaxLevel(currentLevel: number | undefined): boolean {
  return !!currentLevel && currentLevel >= MAX_CHARACTER_LEVEL
}

export type GoalValidationIssue =
  | "alreadyUnlocked"
  | "rankAlreadyReached"
  | "progressionAlreadyReached"
  | "abilityRange"
  | "abilityAlreadyReached"
  | "levelAlreadyReached"

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
  currentLevel: number | undefined
  levelEnd: number
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
  if (params.enabledTypes.has("Ability")) {
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
  }
  if (
    params.enabledTypes.has("Level") &&
    params.currentLevel !== undefined &&
    params.levelEnd <= params.currentLevel
  ) {
    return "levelAlreadyReached"
  }
  return null
}
