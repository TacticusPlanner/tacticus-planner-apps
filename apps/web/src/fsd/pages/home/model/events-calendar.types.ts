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
}

export type EventsCalendarDay = {
  date: string
  entries: EventEntryViewModel[]
}

export type EventsCalendarViewModel = {
  status: EventsCalendarStatus
  days: EventsCalendarDay[]
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
  "id" | "type"
>
