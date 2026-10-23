import { useCallback, useMemo, useState } from "react"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import { selectUpcomingEvents } from "@workspace/game-catalog/queries"

import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import {
  addLocalDays,
  buildEventsCalendarDays,
  buildEventsCalendarLanes,
} from "./events-calendar-calc"
import type { EventsCalendarViewModel } from "./events-calendar.types"

const WEEK_DAYS = 7

function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * Drives the home page's events calendar: a rolling 7-day window navigable forward (into the
 * projection horizon) and backward (into authored/archived occurrences — `selectUpcomingEvents` has no
 * lower bound, unlike the server's forward-only projection window).
 */
export function useEventsCalendar(): EventsCalendarViewModel {
  const [weekOffset, setWeekOffset] = useState(0)
  const rangeStart = useMemo(
    () => addLocalDays(startOfDay(new Date()), weekOffset * WEEK_DAYS),
    [weekOffset]
  )
  const rangeEnd = useMemo(
    () => addLocalDays(rangeStart, WEEK_DAYS),
    [rangeStart]
  )

  // Both reads are cached for the session; changing week only re-selects the window (design D3).
  const selectRange = useCallback(
    (rows: EventsCalendarStorageModel[]) =>
      selectUpcomingEvents(rows, rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  )
  const definitionsState = useCatalogDataset("event-definitions", toById)
  const entriesState = useCatalogDataset("events-calendar", selectRange)
  const definitionsById =
    definitionsState.status === "ready" ? definitionsState.data : undefined
  const entries =
    entriesState.status === "ready" ? entriesState.data : undefined
  const read = combineReadStates(definitionsState, entriesState)

  const days = useMemo(
    () =>
      entries && definitionsById
        ? buildEventsCalendarDays(
            entries,
            definitionsById,
            rangeStart,
            rangeEnd,
            new Date()
          )
        : [],
    [entries, definitionsById, rangeStart, rangeEnd]
  )

  const lanes = useMemo(
    () =>
      entries && definitionsById
        ? buildEventsCalendarLanes(
            entries,
            definitionsById,
            rangeStart,
            rangeEnd,
            new Date()
          )
        : [],
    [entries, definitionsById, rangeStart, rangeEnd]
  )

  const status =
    read.status !== "ready"
      ? read.status
      : days.every((day) => day.entries.length === 0)
        ? "empty"
        : "ready"

  const goToPreviousWeek = useCallback(
    () => setWeekOffset((offset) => offset - 1),
    []
  )
  const goToNextWeek = useCallback(
    () => setWeekOffset((offset) => offset + 1),
    []
  )
  const goToToday = useCallback(() => setWeekOffset(0), [])

  return {
    status,
    days,
    lanes,
    rangeStart,
    rangeEnd,
    weekOffset,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    retry: read.retry,
  }
}
