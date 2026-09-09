import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"

import type { EventsCalendarDay } from "../../../model/events-calendar.types"
import { EventsCalendarMobile } from "./events-calendar-mobile"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

const days: EventsCalendarDay[] = [
  {
    date: "2026-08-02",
    entries: [
      {
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
        isOccurrenceStart: true,
        isOccurrenceEnd: false,
      },
    ],
  },
]

describe("EventsCalendarMobile", () => {
  it("passes occurrence-boundary metadata to mobile event cards", () => {
    render(<EventsCalendarMobile days={days} />)

    expect(screen.getByTestId("events-calendar-mobile")).toBeInTheDocument()
    expect(
      screen.getByTestId("event-occurrence-start-badge")
    ).toHaveTextContent("events:badges.starts")
    expect(
      screen.queryByTestId("event-occurrence-end-badge")
    ).not.toBeInTheDocument()
  })
})
