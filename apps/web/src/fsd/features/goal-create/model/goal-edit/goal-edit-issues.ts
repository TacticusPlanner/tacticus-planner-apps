import type { GoalDetail, GoalKind } from "@/entities/goal"

import {
  getChangedGoalTargetIssue,
  getGoalTargetIssue,
  isValidUpgradeQuantity,
  type GoalTargetDraft,
  type GoalTargetIssue,
} from "../target-edit/goal-target-edit"

/** The message key creation uses for the same problem, so both dialogs say the same thing
 *  (goal-edit-dialog: edit presents a goal the same way creation does). */
const messageKeys = {
  rankNotAboveStart: "goals.create.validation.rankAlreadyReached",
  progressionNotAboveStart: "goals.create.validation.progressionAlreadyReached",
  abilityBelowStart: "goals.create.validation.abilityOutOfRange",
  abilityAboveMax: "goals.create.validation.abilityOutOfRange",
  abilityNoAdvance: "goals.create.validation.abilityRange",
  upgradeQuantity: "goals.create.validation.upgradeQuantity",
  upgradeEmpty: "goals.create.validation.upgradeTargetsRequired",
  upgradeRange: "goals.target.issues.upgradeRange",
} as const satisfies Record<GoalTargetIssue, string>

export type GoalEditIssue = {
  kind: GoalKind
  field: string
  code: GoalTargetIssue
  messageKey: (typeof messageKeys)[GoalTargetIssue]
}

/**
 * The edit target's problems in the creation form's shape (kind, field, message), so the shared card
 * shows them under the same controls. A changed target is fully validated; an untouched stored Rank or
 * Ascension target at or below its start (an import) still shows its message, without blocking Save,
 * since an untouched target is never sent. Each invalid Upgrade quantity is its own row's issue.
 */
export function goalEditIssues(
  detail: GoalDetail,
  draft: GoalTargetDraft
): GoalEditIssue[] {
  const kind = detail.goalType
  const issue =
    getChangedGoalTargetIssue(detail, draft) ??
    (draft.kind === "Rank" || draft.kind === "Ascension"
      ? getGoalTargetIssue(detail, draft)
      : null)
  if (!issue) return []
  if (issue === "upgradeQuantity" && draft.kind === "Upgrade") {
    return draft.targets
      .filter((target) => !isValidUpgradeQuantity(target.quantity))
      .map((target) => ({
        kind,
        field: `quantity-${target.upgradeId}`,
        code: issue,
        messageKey: messageKeys[issue],
      }))
  }
  return [
    {
      kind,
      field:
        issue === "upgradeEmpty" || issue === "upgradeRange"
          ? "materials"
          : "target",
      code: issue,
      messageKey: messageKeys[issue],
    },
  ]
}
