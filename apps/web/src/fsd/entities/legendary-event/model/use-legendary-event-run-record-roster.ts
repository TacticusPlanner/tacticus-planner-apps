import { useQueries } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { legendaryEventPlanQueries } from "../api/legendary-event-plan.queries"
import type {
  LegendaryEventRunRecord,
  RosterSnapshot,
} from "./run-record.types"
import type { ReadState } from "./use-read-state"

/** Each record's roster at its last progress, read on demand: only for the `records` given (the
 *  previous run, and each earlier run the user expands) and only when the record has teams — a
 *  record without teams shows no roster changes. */
export function useLegendaryEventRunRecordRosters(
  eventId: string,
  records: readonly LegendaryEventRunRecord[]
): ReadonlyMap<string, ReadState<RosterSnapshot>> {
  const isAuthenticated = useIsAuthenticated()
  const withTeams = records.filter((record) => record.teams.length > 0)
  const queries = useQueries({
    queries: withTeams.map((record) => ({
      ...legendaryEventPlanQueries.runRecordRoster(eventId, record.id),
      enabled: isAuthenticated,
    })),
  })
  return new Map(
    withTeams.map((record, index): [string, ReadState<RosterSnapshot>] => {
      const query = queries[index]!
      const retry = () => void query.refetch()
      return [
        record.id,
        query.data
          ? { status: "ready", data: query.data, retry }
          : query.isError && !query.isFetching
            ? { status: "error", retry }
            : { status: "loading", retry },
      ]
    })
  )
}
