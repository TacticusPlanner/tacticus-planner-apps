import type { TFunction } from "i18next"

import type { GoalDetail } from "@/entities/goal"

/**
 * The one-line "Farming strategy" summary shown in the read-only detail view: nothing without a detail, the chosen strategy for a Rank goal, and otherwise whether the farm locations are an
 * explicit selection or automatic. Split out of `goal-detail-sheet.tsx` for that file's max-lines budget.
 */
export function goalFarmingSummary(
  t: TFunction,
  detail: GoalDetail | null,
  kind: { isRank: boolean }
): string | null {
  if (!detail) return null
  if (kind.isRank) {
    return t(`goals.create.farmingStrategy.${detail.config.farmingStrategy}`)
  }
  const count = detail.config.farmingLocationIds?.length ?? 0
  return count > 0
    ? t("goals.detail.farmingSelected", { count })
    : t("goals.detail.farmingAuto")
}
