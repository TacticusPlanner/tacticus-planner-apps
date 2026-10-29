import type {
  EventDefinitionStorageModel,
  EventsCalendarStorageModel,
} from "@workspace/game-catalog"

type EventsCalendarStatus = "loading" | "error" | "empty" | "ready"

export type EventEntryViewModel = {
  key: string
  definitionId: string
  definitionType: string | undefined
  occurrenceId: string | null
  confirmed: boolean
  startUtc: string
  endUtc: string
  parameters: Record<string, unknown> | null
  isActiveNow: boolean
  /**
   * A Fixed-recurrence definition's season/event number, derived from this entry's position relative to
   * the definition's own anchor (see `deriveOrdinalFromAnchor` in events-calendar-calc.ts) — not
   * authored data, so it's kept separate from `parameters` rather than merged into it.
   * `derivedSeasonNumber` reads as "Season N" (Battle Pass, Guild War Season); `derivedEventNumber`
   * reads as a bare number (Campaign Event "17").
   */
  derivedSeasonNumber: number | undefined
  derivedEventNumber: number | undefined
}

export type EventsCalendarDayEntry = EventEntryViewModel & {
  isOccurrenceStart: boolean
  isOccurrenceEnd: boolean
}

export type EventsCalendarDay = {
  date: string
  entries: EventsCalendarDayEntry[]
}

/** Mobile's agenda: occurrences carried into the range listed once, then each day's starts, ends and
 *  one-day events (see `buildEventsAgenda`). */
export type EventsAgenda = {
  ongoing: EventEntryViewModel[]
  days: EventsCalendarDay[]
}

export type PositionedEventEntry = EventEntryViewModel & {
  /** 1-indexed day-column within the visible range (matches CSS grid's 1-indexed columns). */
  startColumn: number
  /** Number of day-columns this entry spans, clipped to the visible range. */
  span: number
}

export type EventLane = {
  entries: PositionedEventEntry[]
}

export type EventsCalendarView = "week" | "month"

/** One row of the month grid: its seven days and the Gantt lanes drawn across them. */
export type EventsCalendarWeek = {
  days: EventsCalendarDay[]
  lanes: EventLane[]
}

export type EventsCalendarViewModel = {
  status: EventsCalendarStatus
  view: EventsCalendarView
  setView: (view: EventsCalendarView) => void
  /** The range's own days (the month's days in the month view, not the grid's padding). */
  days: EventsCalendarDay[]
  agenda: EventsAgenda
  /** The week view's lanes; empty in the month view. */
  lanes: EventLane[]
  /** The month view's rows; empty in the week view. */
  weeks: EventsCalendarWeek[]
  rangeStart: Date
  rangeEnd: Date
  /** Weeks or months away from the current one, by `view`. */
  offset: number
  goToPrevious: () => void
  goToNext: () => void
  goToToday: () => void
  retry: () => void
}

export type RawEventsCalendarEntry = Pick<
  EventsCalendarStorageModel,
  | "occurrenceId"
  | "definitionId"
  | "confirmed"
  | "startUtc"
  | "endUtc"
  | "parameters"
>

export type RawEventDefinition = Pick<
  EventDefinitionStorageModel,
  "id" | "type" | "recurrence" | "config"
>
