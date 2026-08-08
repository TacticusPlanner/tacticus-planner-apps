import { useCallback, useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type {
  EventDefinitionStorageModel,
  EventsCalendarStorageModel,
} from "@workspace/game-catalog"
import {
  getEventDefinitions,
  getUpcomingEvents,
} from "@workspace/game-catalog/queries"

import { buildEventsCalendarDays } from "./events-calendar-calc"
import type { EventsCalendarViewModel } from "./events-calendar.types"

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_DAYS = 7

// `useLiveQuery` throws to an error boundary if its querier's promise rejects — it has no built-in
// error-result channel, despite the `defaultResult` third argument's type signature suggesting one. To
// get a real, page-local failure state (this spec's "distinct loading/failure/empty/ready" requirement)
// the querier below catches internally and resolves with a tagged result instead of letting it reject.
// (Total game-catalog sync failure is a separate, already-handled case: `GameCatalogInitGate` blocks the
// whole app with its own retry UI before any page — including this one — ever mounts; what this catches
// is a page-local read failure after that gate has already passed.)
type QueryResult<T> =
  { status: "ok"; data: T } | { status: "error"; error: unknown }

async function loadSafely<T>(load: () => Promise<T>): Promise<QueryResult<T>> {
  try {
    return { status: "ok", data: await load() }
  } catch (error) {
    return { status: "error", error }
  }
}

function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * Drives the home page's events calendar: a rolling 7-day window navigable forward (into the
 * projection horizon) and backward (into authored/archived occurrences — `getUpcomingEvents` has no
 * lower bound, unlike the server's forward-only projection window).
 */
export function useEventsCalendar(): EventsCalendarViewModel {
  const [weekOffset, setWeekOffset] = useState(0)
  const [retryToken, setRetryToken] = useState(0)

  const rangeStart = useMemo(
    () =>
      new Date(
        startOfDay(new Date()).getTime() + weekOffset * WEEK_DAYS * DAY_MS
      ),
    [weekOffset]
  )
  const rangeEnd = useMemo(
    () => new Date(rangeStart.getTime() + WEEK_DAYS * DAY_MS),
    [rangeStart]
  )

  const definitionsResult = useLiveQuery<
    QueryResult<EventDefinitionStorageModel[]>
  >(() => loadSafely(getEventDefinitions), [retryToken])

  const entriesResult = useLiveQuery<QueryResult<EventsCalendarStorageModel[]>>(
    () => loadSafely(() => getUpcomingEvents(rangeStart, rangeEnd)),
    [rangeStart.getTime(), rangeEnd.getTime(), retryToken]
  )

  const definitionsById = useMemo(
    () =>
      new Map(
        (definitionsResult?.status === "ok" ? definitionsResult.data : []).map(
          (definition) => [definition.id, definition]
        )
      ),
    [definitionsResult]
  )

  const days = useMemo(
    () =>
      entriesResult?.status === "ok"
        ? buildEventsCalendarDays(
            entriesResult.data,
            definitionsById,
            rangeStart,
            rangeEnd,
            new Date()
          )
        : [],
    [entriesResult, definitionsById, rangeStart, rangeEnd]
  )

  const status = useMemo(() => {
    if (
      definitionsResult?.status === "error" ||
      entriesResult?.status === "error"
    ) {
      return "error" as const
    }
    if (definitionsResult === undefined || entriesResult === undefined) {
      return "loading" as const
    }
    if (days.every((day) => day.entries.length === 0)) {
      return "empty" as const
    }
    return "ready" as const
  }, [definitionsResult, entriesResult, days])

  const goToPreviousWeek = useCallback(
    () => setWeekOffset((offset) => offset - 1),
    []
  )
  const goToNextWeek = useCallback(
    () => setWeekOffset((offset) => offset + 1),
    []
  )
  const goToToday = useCallback(() => setWeekOffset(0), [])
  const retry = useCallback(() => setRetryToken((token) => token + 1), [])

  return {
    status,
    days,
    rangeStart,
    rangeEnd,
    weekOffset,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    retry,
  }
}
