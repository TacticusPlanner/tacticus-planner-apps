import { useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { legendaryEventPlanQueries } from "../api/legendary-event-plan.queries"
import type { LegendaryEventRunRecord } from "./run-record.types"
import { useQueryReadState } from "@/shared/lib"
import type { ReadState } from "./use-read-state"

/** The event's run records loaded so far, newest first (read-only history; records carry no roster),
 *  and the next older page on demand. Enabled when signed in. */
export function useLegendaryEventRunRecords(eventId: string): {
  records: ReadState<LegendaryEventRunRecord[]>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
} {
  const isAuthenticated = useIsAuthenticated()
  const query = useInfiniteQuery({
    ...legendaryEventPlanQueries.runRecords(eventId),
    enabled: isAuthenticated,
  })
  const data = useMemo(
    () => query.data?.pages.flatMap((page) => page.records),
    [query.data]
  )
  const records = useQueryReadState({
    data,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching && !query.isFetchingNextPage,
    refetch: query.refetch,
  })
  return {
    records,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
  }
}
