import type { TFunction } from "i18next"

import {
  describeRankTargetKey,
  goalRankTargetKey,
  type GoalDetail,
} from "@/entities/goal"
import { projectLastMembership } from "@/entities/project"
import { ApiError } from "@/shared/api"

/** "Silver3" or "Silver3 (3/6)" — the Rank end target a normalized target key stands for, or null when the
 * key is malformed. */
export function rankTargetKeyLabel(
  t: TFunction,
  rankTargetKey: string
): string | null {
  const target = describeRankTargetKey(rankTargetKey)
  if (!target) return null
  const rank = t(`ranks.${target.rank}`, {
    ns: "progression",
    defaultValue: target.rank,
  })
  return target.slots > 0 ? `${rank} (${target.slots}/6)` : rank
}

/**
 * The occupied-slot message, naming the existing goal that holds the slot (spec: api-error-handling:
 * slot conflict names the goal): its unit and kind, and for Rank its exact target (distinct Rank targets
 * coexist, so "already has a Rank goal" would be wrong). Never a project list — the slot is per account.
 */
export function projectConflictText(
  t: TFunction,
  existing: Pick<GoalDetail, "goalType" | "config">,
  unitName: string
): string {
  const key = goalRankTargetKey(existing)
  const target = key ? rankTargetKeyLabel(t, key) : null
  return target
    ? t("goals.project.membershipConflictRank", { unit: unitName, target })
    : t("goals.project.membershipConflict", {
        unit: unitName,
        type: t(`goals.create.goalTypes.${existing.goalType}`),
      })
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
