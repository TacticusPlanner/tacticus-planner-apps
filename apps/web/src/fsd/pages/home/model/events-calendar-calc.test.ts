import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  addLocalDays,
  buildEventsCalendarDays,
  buildEventsCalendarLanes,
} from "./events-calendar-calc"

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

describe("buildEventsCalendarLanes", () => {
  it("positions a single-day entry at the column matching its day offset, span 1", () => {
    const rangeStart = new Date(2026, 6, 26) // 26 Jul 2026 local
    const rangeEnd = new Date(2026, 7, 2)
    const entries = [
      {
        occurrenceId: "occ-warp",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: new Date(2026, 6, 27).toISOString(), // second visible day
        endUtc: new Date(2026, 6, 28).toISOString(),
        parameters: null,
      },
    ]

    const lanes = buildEventsCalendarLanes(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )

    expect(lanes).toHaveLength(1)
    expect(lanes[0]?.entries).toHaveLength(1)
    expect(lanes[0]?.entries[0]).toMatchObject({
      occurrenceId: "occ-warp",
      startColumn: 2,
      span: 1,
    })
  })

  it("clips a multi-day entry's span to the visible range", () => {
    const rangeStart = new Date(2026, 6, 26)
    const rangeEnd = new Date(2026, 7, 2) // 7-day window
    const entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        // Starts 2 days before the range and ends 2 days after it — only the 7 visible days should count.
        startUtc: new Date(2026, 6, 24).toISOString(),
        endUtc: new Date(2026, 7, 4).toISOString(),
        parameters: null,
      },
    ]

    const lanes = buildEventsCalendarLanes(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )

    expect(lanes[0]?.entries[0]).toMatchObject({ startColumn: 1, span: 7 })
  })

  it("packs two non-overlapping entries into the same lane", () => {
    const rangeStart = new Date(2026, 6, 26)
    const rangeEnd = new Date(2026, 7, 2)
    const entries = [
      {
        occurrenceId: "occ-early",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: new Date(2026, 6, 26).toISOString(),
        endUtc: new Date(2026, 6, 27).toISOString(),
        parameters: null,
      },
      {
        occurrenceId: "occ-later",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: new Date(2026, 6, 28).toISOString(),
        endUtc: new Date(2026, 6, 29).toISOString(),
        parameters: null,
      },
    ]

    const lanes = buildEventsCalendarLanes(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )

    expect(lanes).toHaveLength(1)
    expect(lanes[0]?.entries.map((entry) => entry.occurrenceId)).toEqual([
      "occ-early",
      "occ-later",
    ])
  })

  it("places two same-day overlapping entries into separate lanes", () => {
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
      {
        occurrenceId: "occ-warp",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: new Date(2026, 6, 27).toISOString(),
        endUtc: new Date(2026, 6, 28).toISOString(),
        parameters: null,
      },
    ]

    const lanes = buildEventsCalendarLanes(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26)
    )

    expect(lanes).toHaveLength(2)
    expect(
      lanes
        .flatMap((lane) => lane.entries)
        .map((entry) => entry.occurrenceId)
        .sort()
    ).toEqual(["occ-lucius", "occ-warp"].sort())
  })
})

describe("DST-crossing day boundaries", () => {
  beforeEach(() => {
    // A real, DST-observing zone — America/New_York springs forward (23h day) on 2026-03-08 and falls
    // back (25h day) on 2026-11-01. Raw `+ 24 * 60 * 60 * 1000` arithmetic lands on the wrong side of
    // local midnight on either of these days; `addLocalDays` (via `setDate`) must not.
    vi.stubEnv("TZ", "America/New_York")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("addLocalDays lands on the next local midnight across a spring-forward transition (23h day)", () => {
    const beforeSpringForward = new Date(2026, 2, 8, 0, 0, 0) // 8 Mar 2026 00:00 local
    const next = addLocalDays(beforeSpringForward, 1)

    expect(next.getDate()).toBe(9)
    expect(next.getHours()).toBe(0)
    // The real elapsed time is 23h, not 24h — confirms this isn't landing on 23:00 the same day.
    expect(next.getTime() - beforeSpringForward.getTime()).toBe(
      23 * 60 * 60 * 1000
    )
  })

  it("addLocalDays lands on the next local midnight across a fall-back transition (25h day)", () => {
    const beforeFallBack = new Date(2026, 10, 1, 0, 0, 0) // 1 Nov 2026 00:00 local
    const next = addLocalDays(beforeFallBack, 1)

    expect(next.getDate()).toBe(2)
    expect(next.getHours()).toBe(0)
    expect(next.getTime() - beforeFallBack.getTime()).toBe(25 * 60 * 60 * 1000)
  })

  it("buckets an entry late on a spring-forward day under that day, not the next one", () => {
    const rangeStart = new Date(2026, 2, 8) // 8 Mar 2026 (spring-forward day)
    const rangeEnd = addLocalDays(rangeStart, 3)
    const lateOnTransitionDay = new Date(2026, 2, 8, 23, 0, 0) // 23:00 local on the 23h day
    const entries = [
      {
        occurrenceId: "occ-1",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: lateOnTransitionDay.toISOString(),
        endUtc: addLocalDays(lateOnTransitionDay, 1).toISOString(),
        parameters: null,
      },
    ]

    const days = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    )

    const daysWithEntry = days
      .filter((day) => day.entries.length > 0)
      .map((day) => day.date)
    expect(daysWithEntry).toContain("2026-03-08")
  })
})
