import type { PlanInsightsResult } from "../insights/use-plan-insights.domain"

/** A project card's "Done by" from the one global plan run (plan-completion-outlook). */
export type ProjectCompletion = {
  /** The latest estimated finish among the project's planned goals, extended by the plan's
   *  Onslaught token wait; null when none of them can be estimated. */
  completionDate: string | null
  /** The project's planned goals that are not behind `completionDate`. */
  unestimatedGoalCount: number
}

/**
 * A project's completion from the global run, the same figures a run scoped to `goalIds` reports:
 * the latest planned goal date, pushed out (never created) by the plan's Onslaught wait, and how
 * many planned goals have no date. Goals the run did not plan (paused, reached, archived) are
 * ignored.
 */
export function projectCompletion(
  goalIds: readonly string[],
  plan: Pick<
    PlanInsightsResult,
    "goalDates" | "plannedGoalIds" | "onslaughtWaitDate"
  >
): ProjectCompletion {
  const planned = new Set(plan.plannedGoalIds)
  let completionDate: string | null = null
  let unestimatedGoalCount = 0
  for (const goalId of new Set(goalIds)) {
    if (!planned.has(goalId)) continue
    const date = plan.goalDates.get(goalId)
    if (date === undefined) {
      unestimatedGoalCount += 1
      continue
    }
    if (completionDate === null || date > completionDate) completionDate = date
  }
  if (
    completionDate !== null &&
    plan.onslaughtWaitDate !== null &&
    plan.onslaughtWaitDate > completionDate
  ) {
    completionDate = plan.onslaughtWaitDate
  }
  return { completionDate, unestimatedGoalCount }
}
