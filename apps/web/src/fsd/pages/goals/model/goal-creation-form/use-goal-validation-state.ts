import { useTranslation } from "react-i18next"

import {
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalKind } from "@/entities/goal"

import { mowAbilityTrackLevel } from "../estimate/mow-ability-calc"
import {
  getGoalValidationIssue,
  isAtMaxAbility,
  isAtMaxLevel,
  isAtMaxProgression,
  isAtMaxRank,
} from ".//goal-validation"

/**
 * The "can this even be submitted" surface — current ability levels (MoW's own track-level lookup
 * vs. a Character's synced ability array), the preemptive "nowhere left to target" toggle-disable
 * checks, the submit-time validation message, and the final `canSubmit` gate. Split out of
 * `use-create-goal-form.ts` purely for that file's own max-lines budget.
 */
export function useGoalValidationState({
  entityType,
  entityId,
  isOwned,
  enabledTypes,
  playerEntity,
  playerCharacter,
  playerMow,
  rankStart,
  rankEnd,
  progressionStart,
  progressionEnd,
  abilityActiveStart,
  abilityActiveEnd,
  abilityPassiveStart,
  abilityPassiveEnd,
  levelStart,
  levelEnd,
  upgradeFieldsValid,
}: {
  entityType: "Character" | "Mow"
  entityId: UnitId | undefined
  isOwned: boolean
  enabledTypes: ReadonlySet<GoalKind>
  playerEntity: { progressionIndex: Progression } | undefined
  playerCharacter: PlayerDataChunkDto<"characters">[number] | undefined
  playerMow: PlayerDataChunkDto<"mows">[number] | undefined
  rankStart: Rank
  rankEnd: Rank
  progressionStart: Progression
  progressionEnd: Progression
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  levelStart: number
  levelEnd: number
  upgradeFieldsValid: boolean
}) {
  const { t } = useTranslation()

  const currentActiveAbility =
    entityType === "Mow"
      ? mowAbilityTrackLevel(playerMow, "primary")
      : (playerCharacter?.abilities?.[0]?.level ?? 1)
  const currentPassiveAbility =
    entityType === "Mow"
      ? mowAbilityTrackLevel(playerMow, "secondary")
      : (playerCharacter?.abilities?.[1]?.level ?? 1)

  // Preemptive "nowhere left to target" checks (plan: disable the toggle instead of letting the
  // user hit a submit-time validation message) — Rank is Character-only so Mow reads false; Upgrade
  // reuses atMaxRank for a Character (its own rank-range picker would have no valid range either).
  const atMaxRank = isAtMaxRank(playerCharacter?.rank)
  const atMaxProgression = isAtMaxProgression(playerEntity?.progressionIndex)
  const atMaxAbility = isAtMaxAbility(
    playerEntity?.progressionIndex,
    currentActiveAbility,
    currentPassiveAbility
  )
  // Level is Character-only (plan scope decision) — a MoW's own `xpLevel` is never read here.
  const atMaxLevel = isAtMaxLevel(playerCharacter?.xpLevel)

  const validationIssue = getGoalValidationIssue({
    hasEntityId: !!entityId,
    enabledTypes,
    isOwned,
    currentRank: playerCharacter?.rank,
    rankEnd,
    currentProgression: playerEntity?.progressionIndex,
    progressionEnd,
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
    currentActiveAbility,
    currentPassiveAbility,
    currentLevel: playerCharacter?.xpLevel,
    levelEnd,
  })
  const validationMessage = validationIssue
    ? t(`goals.create.validation.${validationIssue}`)
    : null

  const canSubmit =
    !!entityId &&
    enabledTypes.size > 0 &&
    !validationMessage &&
    upgradeFieldsValid &&
    (!enabledTypes.has("Rank") || rankIndex(rankStart) < rankIndex(rankEnd)) &&
    (!enabledTypes.has("Ascension") ||
      progressionIndex(progressionStart) < progressionIndex(progressionEnd)) &&
    (!enabledTypes.has("Level") || levelStart < levelEnd)

  return {
    currentActiveAbility,
    currentPassiveAbility,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
    atMaxLevel,
    validationMessage,
    canSubmit,
  }
}
