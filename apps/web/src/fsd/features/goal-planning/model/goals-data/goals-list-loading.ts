import type { GoalStatusFilterValue } from "@/entities/goal"

/**
 * Whether the Goals list holds its loading state (goal-list-layout: "The list stays in its loading
 * state until row membership is known"): rows never appear and then drop out, and the
 * filtered-empty line never flashes, while what decides membership settles - the goal list (which
 * carries each goal's `projectIds`), a requested scope's project list and, on the tabs that split by
 * it, attainment.
 */
export function isGoalsListLoading(input: {
  goalsLoading: boolean
  tab: GoalStatusFilterValue
  requestedProjectId: string | undefined
  projectsLoading: boolean
  attainmentPending: boolean
  hasCandidateGoals: boolean
}): boolean {
  const scopePending = !!input.requestedProjectId && input.projectsLoading
  const attainmentGatesList =
    (input.tab === "toReach" || input.tab === "reached") &&
    input.attainmentPending &&
    input.hasCandidateGoals
  return input.goalsLoading || scopePending || attainmentGatesList
}
