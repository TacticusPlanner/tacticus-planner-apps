import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { legendaryEventPlanQueries } from "../api/legendary-event-plan.queries"
import type { LegendaryEventRunRecord } from "./run-record.types"
import { queryReadState } from "./use-query-read-state"
import type { ReadState } from "./use-read-state"

/** The event's run records, newest first (read-only history). Enabled when signed in. */
export function useLegendaryEventRunRecords(
  eventId: string
): ReadState<LegendaryEventRunRecord[]> {
  const isAuthenticated = useIsAuthenticated()
  const query = useQuery({
    ...legendaryEventPlanQueries.runRecords(eventId),
    enabled: isAuthenticated,
  })
  return queryReadState(query)
}
