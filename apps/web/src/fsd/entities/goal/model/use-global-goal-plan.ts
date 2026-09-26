import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { goalQueries } from "../api/goal.queries"
import { inFlightInGlobalOrder } from "./goal-order"
import type { GoalSummary } from "./types"

/**
 * The account's one ordered plan (spec: `global-goal-priority`): every Active and Paused goal exactly
 * once, in canonical global order, however many projects hold it. `active` drops Paused goals — they
 * keep their position for display but never enter execution calculations — and `entries` wraps them in
 * the `{ goal }` shape the project-goal consumers already take, so Today, Raids Plan, Insights and
 * the estimates all read one sequence instead of a project's own.
 */
export function useGlobalGoalPlan() {
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated,
  })

  const goals: GoalSummary[] = query.data?.goals ?? []
  const inFlight = inFlightInGlobalOrder(goals)
  const active = inFlight.filter((goal) => goal.status === "Active")

  return {
    /** Active and Paused goals in global order (what Global Plan shows). */
    inFlight,
    /** Active goals only, in global order (what planning consumes). */
    active,
    entries: active.map((goal) => ({ goal })),
    /** Every non-archived goal, including Completed ones. */
    goals,
    orderRevision: query.data?.orderRevision ?? 0,
    /** True until the first response; a failed load is `isError`, never an empty plan. */
    loading: isAuthenticated && query.isPending,
    isError: query.isError,
    retry: () => {
      void query.refetch()
    },
  }
}
