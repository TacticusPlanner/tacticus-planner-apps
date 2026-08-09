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
   * A Fixed-recurrence definition's season/slot number, derived from this entry's position relative to
   * the definition's own anchor (see `deriveSeasonNumber` in events-calendar-calc.ts) — not authored
   * data, so it's kept separate from `parameters` rather than merged into it.
   */
  derivedSeasonNumber: number | undefined
}

export type EventsCalendarDay = {
  date: string
  entries: EventEntryViewModel[]
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

export type EventsCalendarViewModel = {
  status: EventsCalendarStatus
  days: EventsCalendarDay[]
  lanes: EventLane[]
  rangeStart: Date
  rangeEnd: Date
  weekOffset: number
  goToPreviousWeek: () => void
  goToNextWeek: () => void
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
