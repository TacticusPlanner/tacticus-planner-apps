import {
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

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
