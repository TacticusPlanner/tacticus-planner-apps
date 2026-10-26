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

import { milestoneOrderIssue, type GoalMilestones } from "./goal-milestones"

import { mowAbilityTrackLevel } from "@/features/goal-farming/@x/goal-create"
import {
  getGoalValidationIssue,
  isAtMaxAbility,
  isAtMaxProgression,
  isAtMaxRank,
} from "@/features/goal-planning/@x/goal-create"

/**
 * The "can this even be submitted" surface — current ability levels (MoW's own track-level lookup
 * vs. a Character's synced ability array), the preemptive "nowhere left to target" toggle-disable
 * checks, the submit-time validation message, and the final `canSubmit` gate. Kept as its own
 * hook so `use-create-goal-form.ts` stays under the 800-line ceiling.
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
  upgradeFieldsValid,
  milestones,
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
  upgradeFieldsValid: boolean
  milestones: GoalMilestones
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
    upgradeFieldsValid,
  })
  // Each added milestone must be above the one before it (goal-target-milestones); the card shows the
  // message on that milestone, and this one blocks submission.
  const milestoneIssue = milestoneOrderIssue({
    enabledTypes,
    rankEnd,
    progressionEnd,
    ability: { activeEnd: abilityActiveEnd, passiveEnd: abilityPassiveEnd },
    milestones,
  })
  const validationMessage = validationIssue
    ? t(`goals.create.validation.${validationIssue}`)
    : milestoneIssue
      ? t("goals.create.milestones.notAbove")
      : null

  // Every gate below either has a `validationMessage` of its own or is unreachable through the UI's
  // own option lists (a start/end select never offers an inverted range) — an Upgrade goal's missing
  // target is the one that used to disable submit silently, and now reports itself as an issue.
  const canSubmit =
    !!entityId &&
    enabledTypes.size > 0 &&
    !validationMessage &&
    (!enabledTypes.has("Rank") || rankIndex(rankStart) < rankIndex(rankEnd)) &&
    (!enabledTypes.has("Ascension") ||
      progressionIndex(progressionStart) < progressionIndex(progressionEnd))

  return {
    currentActiveAbility,
    currentPassiveAbility,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
    validationMessage,
    milestoneIssue,
    canSubmit,
  }
}
