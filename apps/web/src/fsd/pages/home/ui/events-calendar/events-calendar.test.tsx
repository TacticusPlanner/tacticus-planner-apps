import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@/test/render"

import { EventsCalendar } from "./events-calendar"

const definitions = [
  { id: "legendary-event", type: "LegendaryEvent" },
  { id: "hse-warp-surge", type: "HomeScreenEvent" },
]

let entries: unknown[] = []

vi.mock("@workspace/game-catalog/queries", () => ({
  getEventDefinitions: () => Promise.resolve(definitions),
  getUpcomingEvents: () => Promise.resolve(entries),
}))

// Matches the fake-effect-based useLiveQuery mock established in goals-page.test.tsx — real
// Dexie.liveQuery() relies on internal Promise patching that doesn't play well with a querier that
// never actually touches a Dexie table (as here, once game-catalog/queries is mocked above).
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

function isoDaysFromNow(days: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

describe("EventsCalendar", () => {
  beforeEach(() => {
    entries = []
  })

  it("shows a loading state, then an empty state when there are no entries in range", async () => {
    render(<EventsCalendar />)

    expect(screen.getByTestId("events-calendar-loading")).toBeInTheDocument()

    await waitFor(() =>
      expect(
        screen.queryByTestId("events-calendar-loading")
      ).not.toBeInTheDocument()
    )
    expect(
      screen.queryByTestId("events-calendar-empty") ??
        screen.getByTestId("events-calendar-mobile-empty")
    ).toBeInTheDocument()
  })

  it("renders a confirmed occurrence and a projected placeholder distinctly", async () => {
    entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(1),
        endUtc: isoDaysFromNow(8),
        parameters: null,
      },
      {
        occurrenceId: null,
        definitionId: "hse-warp-surge",
        confirmed: false,
        startUtc: isoDaysFromNow(2),
        endUtc: isoDaysFromNow(3),
        parameters: null,
      },
    ]

    render(<EventsCalendar />)

    const cards = await screen.findAllByTestId("event-entry-card")
    expect(cards.length).toBeGreaterThan(0)

    const confirmedBadges = screen.getAllByTestId("event-confirmed-badge")
    expect(
      confirmedBadges.some(
        (badge) => badge.textContent === "events:badges.confirmed"
      )
    ).toBe(true)
    expect(
      confirmedBadges.some(
        (badge) => badge.textContent === "events:badges.projected"
      )
    ).toBe(true)
  })

  it("shows a legend swatch only for color categories present in the visible range", async () => {
    entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(1),
        endUtc: isoDaysFromNow(8),
        parameters: null,
      },
    ]

    render(<EventsCalendar />)

    await screen.findAllByTestId("event-entry-card")

    const legend = screen.getByTestId("events-calendar-legend")
    expect(legend).toHaveTextContent("legend.legendary")
    expect(legend).not.toHaveTextContent("legend.homeScreen")
  })

  it("marks an entry active when the current time falls within its window", async () => {
    entries = [
      {
        occurrenceId: "occ-active",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(-1),
        endUtc: isoDaysFromNow(5),
        parameters: null,
      },
    ]

    render(<EventsCalendar />)

    expect(await screen.findAllByTestId("event-active-badge")).not.toHaveLength(
      0
    )
  })

  it("does not mark an entry active outside its window", async () => {
    entries = [
      {
        occurrenceId: "occ-future",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(3),
        endUtc: isoDaysFromNow(10),
        parameters: null,
      },
    ]

    render(<EventsCalendar />)

    await screen.findAllByTestId("event-entry-card")
    expect(screen.queryByTestId("event-active-badge")).not.toBeInTheDocument()
  })

  it("navigates to the next/previous week and back to today", async () => {
    render(<EventsCalendar />)

    await waitFor(() =>
      expect(
        screen.queryByTestId("events-calendar-loading")
      ).not.toBeInTheDocument()
    )

    const initialLabel = screen.getByTestId(
      "events-calendar-range-label"
    ).textContent

    screen.getByTestId("events-calendar-next-week").click()
    await waitFor(() =>
      expect(
        screen.getByTestId("events-calendar-range-label").textContent
      ).not.toBe(initialLabel)
    )

    screen.getByTestId("events-calendar-previous-week").click()
    await waitFor(() =>
      expect(
        screen.getByTestId("events-calendar-range-label").textContent
      ).toBe(initialLabel)
    )
  })
})
