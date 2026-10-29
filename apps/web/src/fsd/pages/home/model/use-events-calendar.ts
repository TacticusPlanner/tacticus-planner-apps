import { useCallback, useMemo, useState } from "react"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import { selectUpcomingEvents } from "@workspace/game-catalog/queries"

import { combineReadStates, usePersistedSelection } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import {
  buildEventsAgenda,
  buildEventsCalendarDays,
  buildEventsCalendarLanes,
  buildEventsCalendarWeeks,
  resolveEventsCalendarRange,
} from "./events-calendar-calc"
import type {
  EventsCalendarView,
  EventsCalendarViewModel,
} from "./events-calendar.types"

export const EVENTS_CALENDAR_VIEW_KEY = "home.eventsCalendar.view"

const isEventsCalendarView = (value: unknown): value is EventsCalendarView =>
  value === "week" || value === "month"

/**
 * Drives the home page's events calendar: a rolling 7-day window or a calendar month, navigable
 * forward (into the projection horizon) and backward (into authored/archived occurrences —
 * `selectUpcomingEvents` has no lower bound, unlike the server's forward-only projection window).
 */
export function useEventsCalendar(): EventsCalendarViewModel {
  const [view, setStoredView] = usePersistedSelection(
    EVENTS_CALENDAR_VIEW_KEY,
    isEventsCalendarView,
    "week"
  )
  const [offset, setOffset] = useState(0)
  const { rangeStart, rangeEnd, gridStart, gridEnd } = useMemo(
    () => resolveEventsCalendarRange(view, offset, new Date()),
    [view, offset]
  )

  // Both reads are cached for the session; changing range only re-selects the window (design D3).
  const selectRange = useCallback(
    (rows: EventsCalendarStorageModel[]) =>
      selectUpcomingEvents(rows, gridStart, gridEnd),
    [gridStart, gridEnd]
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

  const agenda = useMemo(
    () => buildEventsAgenda(days, rangeStart),
    [days, rangeStart]
  )

  const lanes = useMemo(
    () =>
      view === "week" && entries && definitionsById
        ? buildEventsCalendarLanes(
            entries,
            definitionsById,
            rangeStart,
            rangeEnd,
            new Date()
          )
        : [],
    [view, entries, definitionsById, rangeStart, rangeEnd]
  )

  const weeks = useMemo(
    () =>
      view === "month" && entries && definitionsById
        ? buildEventsCalendarWeeks(
            entries,
            definitionsById,
            gridStart,
            gridEnd,
            new Date()
          )
        : [],
    [view, entries, definitionsById, gridStart, gridEnd]
  )

  const status =
    read.status !== "ready"
      ? read.status
      : days.every((day) => day.entries.length === 0)
        ? "empty"
        : "ready"

  // A new view starts from the current week or month rather than reinterpreting the old offset.
  const setView = useCallback(
    (next: EventsCalendarView) => {
      setStoredView(next)
      setOffset(0)
    },
    [setStoredView]
  )
  const goToPrevious = useCallback(() => setOffset((value) => value - 1), [])
  const goToNext = useCallback(() => setOffset((value) => value + 1), [])
  const goToToday = useCallback(() => setOffset(0), [])

  return {
    status,
    view,
    setView,
    days,
    agenda,
    lanes,
    weeks,
    rangeStart,
    rangeEnd,
    offset,
    goToPrevious,
    goToNext,
    goToToday,
    retry: read.retry,
  }
}
