import type { TFunction } from "i18next"

import { goalTargetLabel, type GoalDetail } from "@/entities/goal"
import { projectLastMembership } from "@/entities/project"
import { ApiError } from "@/shared/api"

/**
 * The occupied-slot message, naming the existing goal that holds the slot (spec: api-error-handling:
 * slot conflict names the goal): its unit and kind, and for every keyed type its exact target (distinct
 * targets coexist, so "already has an Ascension goal" would be wrong). Never a project list — the slot
 * is per account.
 */
export function projectConflictText(
  t: TFunction,
  existing: Pick<GoalDetail, "goalType" | "config">,
  unitName: string
): string {
  const target = goalTargetLabel(t, existing)
  if (target && existing.goalType === "Rank") {
    return t("goals.project.membershipConflictRank", { unit: unitName, target })
  }
  const type = t(`goals.create.goalTypes.${existing.goalType}`)
  return target
    ? t("goals.project.membershipConflictTarget", {
        unit: unitName,
        type,
        target,
      })
    : t("goals.project.membershipConflict", { unit: unitName, type })
}

/**
 * The one-line report for a rejected project-membership change (`changeProjectMembership`): a removal
 * that would leave a goal in no project says so, and anything else falls back to the server's message or
 * the generic action error. Membership is never slot-checked, so it never fails on an occupied slot.
 */
export function membershipErrorText(t: TFunction, error: unknown): string {
  if (projectLastMembership(error)) {
    return t("goals.project.removeLastMembership")
  }
  return error instanceof ApiError
    ? error.message
    : t("goals.toasts.actionError")
}
