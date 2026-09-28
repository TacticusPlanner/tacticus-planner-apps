import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { useGlobalGoalPlan } from "@/entities/goal"
import { projectQueries } from "@/entities/project"

/**
 * The global plan's Active goals, optionally narrowed to one project's members. The order stays the
 * global one; a project only decides which goals take part in the run.
 */
export function useScopedGoalPlan(projectId: string | undefined) {
  const isAuthenticated = useIsAuthenticated()
  const globalPlan = useGlobalGoalPlan()
  const membersQuery = useQuery({
    ...projectQueries.goals(projectId ?? "none"),
    enabled: Boolean(isAuthenticated && projectId),
  })
  const entries = useMemo(() => {
    if (!projectId) return globalPlan.entries
    const memberIds = new Set(
      membersQuery.data?.goals.map((m) => m.goal.goalId)
    )
    return globalPlan.entries.filter((entry) =>
      memberIds.has(entry.goal.goalId)
    )
  }, [globalPlan.entries, membersQuery.data, projectId])

  return {
    entries,
    loading: globalPlan.loading || Boolean(projectId && membersQuery.isPending),
    isError: globalPlan.isError || membersQuery.isError,
  }
}
