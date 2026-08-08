import { describe, expect, it } from "vitest"

import { buildEventsCalendarDays } from "./events-calendar-calc"

const definitionsById = new Map([
  ["legendary-event", { id: "legendary-event", type: "LegendaryEvent" }],
  ["hse-warp-surge", { id: "hse-warp-surge", type: "HomeScreenEvent" }],
])

describe("buildEventsCalendarDays", () => {
  it("buckets a single-day entry under exactly one visible date", () => {
    const rangeStart = new Date(2026, 6, 26) // 26 Jul 2026 local
    const rangeEnd = new Date(2026, 7, 2) // 2 Aug 2026 local (7-day window)
    const entries = [
      {
        occurrenceId: "occ-warp",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: new Date(2026, 6, 27).toISOString(),
        endUtc: new Date(2026, 6, 28).toISOString(),
        parameters: null,
      },
    ]

    const days = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )

    const daysWithEntries = days.filter((day) => day.entries.length > 0)
    expect(daysWithEntries).toHaveLength(1)
    expect(daysWithEntries[0]?.entries[0]?.occurrenceId).toBe("occ-warp")
  })

  it("buckets a multi-day entry under every visible date it spans", () => {
    const rangeStart = new Date(2026, 6, 26)
    const rangeEnd = new Date(2026, 7, 2)
    const entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: new Date(2026, 6, 26).toISOString(),
        endUtc: new Date(2026, 7, 2).toISOString(),
        parameters: null,
      },
    ]

    const days = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )

    const daysWithEntries = days.filter((day) => day.entries.length > 0)
    expect(daysWithEntries).toHaveLength(7)
    expect(
      daysWithEntries.every(
        (day) => day.entries[0]?.occurrenceId === "occ-lucius"
      )
    ).toBe(true)
  })

  it("flags an entry active only when `now` falls within its window", () => {
    const rangeStart = new Date(2026, 6, 26)
    const rangeEnd = new Date(2026, 7, 2)
    const entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: new Date(2026, 6, 26).toISOString(),
        endUtc: new Date(2026, 7, 2).toISOString(),
        parameters: null,
      },
    ]

    const daysDuring = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 28)
    )
    const duringEntry = daysDuring.find((day) => day.date === "2026-07-28")
      ?.entries[0]
    expect(duringEntry?.isActiveNow).toBe(true)

    const daysAfter = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 8, 1)
    )
    const laterEntry = daysAfter.find((day) => day.date === "2026-07-28")
      ?.entries[0]
    expect(laterEntry?.isActiveNow).toBe(false)
  })

  it("attaches the resolved definition type from definitionsById", () => {
    const rangeStart = new Date(2026, 6, 26)
    const rangeEnd = new Date(2026, 7, 2)
    const entries = [
      {
        occurrenceId: null,
        definitionId: "hse-warp-surge",
        confirmed: false,
        startUtc: new Date(2026, 6, 27).toISOString(),
        endUtc: new Date(2026, 6, 28).toISOString(),
        parameters: null,
      },
    ]

    const days = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )
    const entry = days.find((day) => day.entries.length > 0)?.entries[0]

    expect(entry?.definitionType).toBe("HomeScreenEvent")
    expect(entry?.confirmed).toBe(false)
  })
})
