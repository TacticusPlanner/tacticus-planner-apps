import { useMemo } from "react"

import { useGlobalGoalPlan } from "@/entities/goal"

/**
 * The global plan's Active goals, optionally narrowed to one project's members (each goal carries its
 * `projectIds`, so no membership read exists). The order stays the global one; a project only decides
 * which goals take part in the run.
 */
export function useScopedGoalPlan(projectId: string | undefined) {
  const globalPlan = useGlobalGoalPlan()
  const entries = useMemo(
    () =>
      projectId
        ? globalPlan.entries.filter((entry) =>
            entry.goal.projectIds.includes(projectId)
          )
        : globalPlan.entries,
    [globalPlan.entries, projectId]
  )

  return {
    entries,
    loading: globalPlan.loading,
    isError: globalPlan.isError,
  }
}
