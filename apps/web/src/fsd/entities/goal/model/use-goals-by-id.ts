import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { goalQueries } from "../api/goal.queries"
import type { GoalDetail } from "./types"

/**
 * Every goal by id, read from the goals list — the one canonical goal read (no read fetches a goal's
 * detail separately). Holds non-archived goals only, so joining a project's `goalIds` against it yields
 * the project's active members even though `goalIds` also lists archived ones; the one view that shows
 * archived members (the Goals page's archived filter) passes `includeArchived` to merge the archived
 * list into the same map.
 */
export function useGoalsById({
  includeArchived = false,
}: { includeArchived?: boolean } = {}) {
  const isAuthenticated = useIsAuthenticated()
  const active = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated,
  })
  const archived = useQuery({
    ...goalQueries.list(true),
    enabled: isAuthenticated && includeArchived,
  })

  const goalsById = useMemo(() => {
    const map = new Map<string, GoalDetail>()
    for (const goal of active.data?.goals ?? []) map.set(goal.goalId, goal)
    if (includeArchived) {
      for (const goal of archived.data?.goals ?? []) map.set(goal.goalId, goal)
    }
    return map as ReadonlyMap<string, GoalDetail>
  }, [active.data, archived.data, includeArchived])

  return {
    goalsById,
    loading:
      isAuthenticated &&
      (active.isPending || (includeArchived && archived.isPending)),
    isError: active.isError || (includeArchived && archived.isError),
    retry: () => {
      void active.refetch()
      if (includeArchived) void archived.refetch()
    },
  }
}
