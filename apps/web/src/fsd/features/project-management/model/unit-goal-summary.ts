import type { TFunction } from "i18next"

/** "3 units · 5 goals", each count pluralized. */
export const unitGoalSummaryText = (
  t: TFunction,
  { units, goals }: { units: number; goals: number }
): string =>
  t("goals.project.unitGoalSummary", {
    units: t("goals.project.unitCount", { count: units }),
    goals: t("goals.project.goalCount", { count: goals }),
  })
