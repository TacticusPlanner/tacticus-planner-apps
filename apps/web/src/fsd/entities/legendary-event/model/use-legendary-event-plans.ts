import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { legendaryEventPlanQueries } from "../api/legendary-event-plan.queries"
import type { LegendaryEventPlan } from "./plan.types"
import { useQueryReadState } from "@/shared/lib"
import type { ReadState } from "./use-read-state"

/** Every stored plan of the caller (the master table's team membership). Enabled when signed in;
 *  every plan write refreshes it (see `usePlanWriteQueue`). */
export function useLegendaryEventPlans(): ReadState<LegendaryEventPlan[]> {
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...legendaryEventPlanQueries.list(),
    enabled: isAuthenticated,
  })
  return useQueryReadState(query)
}
