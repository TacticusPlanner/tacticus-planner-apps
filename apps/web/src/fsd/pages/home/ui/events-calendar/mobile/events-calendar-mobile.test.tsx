import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"

import type {
  EventEntryViewModel,
  EventsAgenda,
} from "../../../model/events-calendar.types"
import { EventsCalendarMobile } from "./events-calendar-mobile"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
    i18n: { resolvedLanguage: "en", language: "en" },
  }),
}))

const entry = (
  overrides: Partial<EventEntryViewModel>
): EventEntryViewModel => ({
  key: "test",
  definitionId: "legendary-event",
  definitionType: "LegendaryEvent",
  occurrenceId: "occ-1",
  confirmed: true,
  startUtc: "2026-08-02T00:00:00Z",
  endUtc: "2026-08-09T00:00:00Z",
  parameters: null,
  isActiveNow: false,
  derivedSeasonNumber: undefined,
  derivedEventNumber: undefined,
  ...overrides,
})

describe("EventsCalendarMobile", () => {
  it("lists ongoing events once, then each day's starts", () => {
    const agenda: EventsAgenda = {
      ongoing: [
        entry({
          key: "bp",
          definitionId: "battle-pass",
          definitionType: "BattlePass",
          startUtc: "2026-07-20T00:00:00Z",
          endUtc: "2026-08-20T00:00:00Z",
        }),
      ],
      days: [
        {
          date: "2026-08-02",
          entries: [
            { ...entry({}), isOccurrenceStart: true, isOccurrenceEnd: false },
          ],
        },
      ],
    }
    render(<EventsCalendarMobile agenda={agenda} />)

    const ongoing = screen.getByTestId("events-calendar-ongoing")
    expect(within(ongoing).getByText("battle-pass")).toBeInTheDocument()
    const [day] = screen.getAllByTestId("events-calendar-day-section")
    expect(day).toBeDefined()
    expect(
      within(day as HTMLElement).getByTestId("event-occurrence-start-badge")
    ).toHaveTextContent("badges.starts")
    expect(within(day as HTMLElement).queryByText("battle-pass")).toBeNull()
  })

  it("shows the empty state when nothing is ongoing or scheduled", () => {
    render(<EventsCalendarMobile agenda={{ ongoing: [], days: [] }} />)

    expect(
      screen.getByTestId("events-calendar-mobile-empty")
    ).toHaveTextContent("states.empty")
  })
})
