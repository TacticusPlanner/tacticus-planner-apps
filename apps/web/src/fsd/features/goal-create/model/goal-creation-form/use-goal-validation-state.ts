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
  getGoalValidationIssues,
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
  invalidUpgradeQuantityIds,
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
  /** Upgrade rows whose quantity is empty, not whole, or outside 1–10,000. */
  invalidUpgradeQuantityIds: readonly string[]
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

  const targetIssues = getGoalValidationIssues({
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
  const issues: GoalFormIssueView[] = [
    ...targetIssues.map(({ kind, field, issue }) => ({
      kind,
      field,
      code: issue,
      message: t(`goals.create.validation.${issue}`),
    })),
    ...(enabledTypes.has("Upgrade")
      ? invalidUpgradeQuantityIds.map((id) => ({
          kind: "Upgrade" as const,
          field: `quantity-${id}`,
          code: "upgradeQuantity",
          message: t("goals.create.validation.upgradeQuantity"),
        }))
      : []),
    ...(milestoneIssue
      ? [
          {
            kind: milestoneIssue.kind,
            field: `milestone-${milestoneIssue.index}`,
            code: "milestoneNotAbove",
            message: t("goals.create.milestones.notAbove"),
          },
        ]
      : []),
  ]

  // Every gate below either has an issue of its own or is unreachable through the UI's own option
  // lists (a start/end select never offers an inverted range).
  const canSubmit =
    !!entityId &&
    enabledTypes.size > 0 &&
    issues.length === 0 &&
    (!enabledTypes.has("Rank") || rankIndex(rankStart) < rankIndex(rankEnd)) &&
    (!enabledTypes.has("Ascension") ||
      progressionIndex(progressionStart) < progressionIndex(progressionEnd))

  return {
    currentActiveAbility,
    currentPassiveAbility,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
    issues,
    milestoneIssue,
    canSubmit,
  }
}

/** One blocking problem as the form shows it: in `kind`'s card, under the control named by `field`. */
export type GoalFormIssueView = {
  kind: GoalKind
  field: string
  /** What is wrong (`slotConflict`, `upgradeQuantity`, or a `GoalValidationIssue`). */
  code: string
  message: string
}
