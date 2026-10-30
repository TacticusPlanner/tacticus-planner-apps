import { useTranslation } from "react-i18next"

import { useGoalCatalog } from "@/features/goal-planning"

/** What the Insights sections need to name a goal: its unit and goal type. */
export type InsightsGoalInfo = {
  entityType: string
  entityId: string
  goalType: string
}

/** How many goals the outlook names as setting the plan's date. */
const CRITICAL_GOAL_COUNT = 3

/** The goal's edit dialog on the Goals list (`?goal=` opens it). */
export function goalHref(goalId: string) {
  return `/plan/goals?goal=${encodeURIComponent(goalId)}`
}

/** Whole days from `today` to the ISO `yyyy-mm-dd` date, never negative (Day 1 is today). */
export function daysUntil(isoDate: string, today = new Date()) {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number)
  const target = Date.UTC(year, month - 1, day)
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  )
  return Math.max(0, Math.round((target - start) / 86_400_000))
}

/** The goals that set the plan's date: the latest finishes first, taken from a list already sorted
 *  latest first. */
export function criticalGoals<T>(goalOutlook: readonly T[]) {
  return goalOutlook.slice(0, CRITICAL_GOAL_COUNT)
}

/** Names a goal "<unit> · <goal type>" for the Insights lists; unknown ids get no label. */
export function useGoalLabel(
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  return (goalId: string) => {
    const info = goalInfoById.get(goalId)
    if (!info) return null
    return {
      name: getEntityName(info.entityType, info.entityId),
      goalType: t(`goals.create.goalTypes.${info.goalType}`, {
        defaultValue: info.goalType,
      }),
    }
  }
}

/** The distinct unit names behind a set of goals, in first-seen order. */
export function useGoalUnitNames(
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
) {
  const label = useGoalLabel(goalInfoById)
  return (goalIds: readonly string[]) => [
    ...new Set(
      goalIds
        .map((goalId) => label(goalId)?.name)
        .filter((name): name is string => !!name)
    ),
  ]
}
