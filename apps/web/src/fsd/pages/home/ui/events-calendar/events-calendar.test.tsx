import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { EventsCalendar } from "./events-calendar"

const noneRecurrence = {
  kind: "None" as const,
  intervalDays: null,
  durationDays: null,
  anchorUtc: null,
}

const definitions = [
  {
    id: "legendary-event",
    type: "LegendaryEvent",
    recurrence: noneRecurrence,
    config: null,
  },
  {
    id: "hse-warp-surge",
    type: "HomeScreenEvent",
    recurrence: noneRecurrence,
    config: null,
  },
  {
    id: "game-version-release",
    type: "GameVersionRelease",
    recurrence: noneRecurrence,
    config: null,
  },
  {
    id: "always-double-xp-sunday",
    type: "StandingModifier",
    recurrence: {
      kind: "Fixed" as const,
      intervalDays: 7,
      durationDays: 1,
      anchorUtc: "2024-01-07T00:00:00Z",
    },
    config: null,
  },
]

type CalendarEntry = {
  occurrenceId: string | null
  definitionId: string
  confirmed: boolean
  startUtc: string
  endUtc: string
  parameters: null
}

// The calendar payload is keyed by date; the queries filter on each entry's own window.
function seedCalendar(entries: CalendarEntry[]) {
  const byDate: Record<string, CalendarEntry[]> = {}
  for (const entry of entries) {
    ;(byDate[entry.startUtc.slice(0, 10)] ??= []).push(entry)
  }
  return seedGameCatalog({
    "event-definitions": definitions,
    "events-calendar": byDate,
  })
}

function isoDaysFromNow(days: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

describe("EventsCalendar", () => {
  it("shows a loading state, then an empty state when there are no entries in range", async () => {
    await seedCalendar([])
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
    await seedCalendar([
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
    ])

    render(<EventsCalendar />)

    const cards = await screen.findAllByTestId("event-entry-card")
    expect(cards.length).toBeGreaterThan(0)

    const confirmedBadges = screen.getAllByTestId("event-confirmed-badge")
    expect(
      confirmedBadges.some((badge) => badge.textContent === "Confirmed")
    ).toBe(true)
    expect(
      confirmedBadges.some((badge) => badge.textContent === "Projected")
    ).toBe(true)
  })

  it("links to the wiki from an entry's details when its definition has an article", async () => {
    const user = userEvent.setup()
    await seedCalendar([
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
        definitionId: "game-version-release",
        confirmed: false,
        startUtc: isoDaysFromNow(2),
        endUtc: isoDaysFromNow(3),
        parameters: null,
      },
    ])

    render(<EventsCalendar />)

    await screen.findAllByTestId("event-entry-card")

    // The Wiki link moved off the bar into the entry's details popover.
    expect(screen.queryByRole("link", { name: "Wiki" })).toBeNull()
    const cardFor = (name: string) =>
      screen
        .getAllByTestId("event-entry-card")
        .find((card) => card.textContent?.includes(name))!

    await user.click(cardFor("Legendary Event"))
    const wikiLink = await screen.findByRole("link", { name: "Wiki" })
    expect(wikiLink).toHaveAttribute(
      "href",
      "https://tacticus.wiki.gg/wiki/Legendary_Character_Events"
    )
    expect(wikiLink).toHaveAttribute("target", "_blank")
    expect(wikiLink).toHaveAttribute("rel", "noopener noreferrer")

    await user.keyboard("{Escape}")
    await user.click(cardFor("Update"))
    await screen.findByTestId("event-details")
    expect(screen.queryByRole("link", { name: "Wiki" })).toBeNull()
  })

  it("shows a legend swatch only for color categories present in the visible range", async () => {
    await seedCalendar([
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(1),
        endUtc: isoDaysFromNow(8),
        parameters: null,
      },
    ])

    render(<EventsCalendar />)

    await screen.findAllByTestId("event-entry-card")

    const legend = screen.getByTestId("events-calendar-legend")
    expect(legend).toHaveTextContent("Hero events")
    expect(legend).not.toHaveTextContent("Campaigns")
  })

  it("groups Double XP under its family swatch alongside the hero family", async () => {
    await seedCalendar([
      {
        occurrenceId: "occ-double-xp",
        definitionId: "always-double-xp-sunday",
        confirmed: true,
        startUtc: isoDaysFromNow(1),
        endUtc: isoDaysFromNow(2),
        parameters: null,
      },
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(1),
        endUtc: isoDaysFromNow(8),
        parameters: null,
      },
    ])

    render(<EventsCalendar />)

    await screen.findAllByTestId("event-entry-card")

    const legend = screen.getByTestId("events-calendar-legend")
    // Double XP is a standing modifier, so it shares the passes family swatch.
    expect(legend).toHaveTextContent("Hero events")
    expect(legend).toHaveTextContent("Passes & boosts")
  })

  it("marks an entry active when the current time falls within its window", async () => {
    await seedCalendar([
      {
        occurrenceId: "occ-active",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(-1),
        endUtc: isoDaysFromNow(5),
        parameters: null,
      },
    ])

    render(<EventsCalendar />)

    expect(await screen.findAllByTestId("event-active-badge")).not.toHaveLength(
      0
    )
  })

  it("does not mark an entry active outside its window", async () => {
    await seedCalendar([
      {
        occurrenceId: "occ-future",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: isoDaysFromNow(3),
        endUtc: isoDaysFromNow(10),
        parameters: null,
      },
    ])

    render(<EventsCalendar />)

    await screen.findAllByTestId("event-entry-card")
    expect(screen.queryByTestId("event-active-badge")).not.toBeInTheDocument()
  })

  it("navigates to the next/previous week and back to today", async () => {
    await seedCalendar([])
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
