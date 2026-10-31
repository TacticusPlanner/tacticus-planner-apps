import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  addLocalDays,
  buildEventsAgenda,
  buildEventsCalendarDays,
  buildEventsCalendarLanes,
  buildEventsCalendarWeeks,
  resolveEventsCalendarRange,
  toIsoDate,
  withGuildRaidBreaks,
} from "./events-calendar-calc"

const noneRecurrence = {
  kind: "None" as const,
  intervalDays: null,
  durationDays: null,
  anchorUtc: null,
}

const definitionsById = new Map([
  [
    "legendary-event",
    {
      id: "legendary-event",
      type: "LegendaryEvent",
      recurrence: noneRecurrence,
      config: null,
    },
  ],
  [
    "hse-warp-surge",
    {
      id: "hse-warp-surge",
      type: "HomeScreenEvent",
      recurrence: noneRecurrence,
      config: null,
    },
  ],
  [
    "always-double-xp-sunday",
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
  ],
  [
    "always-double-gold-saturday",
    {
      id: "always-double-gold-saturday",
      type: "StandingModifier",
      recurrence: {
        kind: "Fixed" as const,
        intervalDays: 7,
        durationDays: 1,
        anchorUtc: "2024-01-06T00:00:00Z",
      },
      config: null,
    },
  ],
  [
    "battle-pass",
    {
      id: "battle-pass",
      type: "BattlePass",
      recurrence: {
        kind: "Fixed" as const,
        intervalDays: 35,
        durationDays: 34,
        anchorUtc: "2026-08-02T00:00:00Z",
      },
      config: { seasonNumberAtAnchor: 40 },
    },
  ],
  [
    "battle-pass-invalid-anchor",
    {
      id: "battle-pass-invalid-anchor",
      type: "BattlePass",
      recurrence: {
        kind: "Fixed" as const,
        intervalDays: 35,
        durationDays: 34,
        anchorUtc: "not-a-date",
      },
      config: { seasonNumberAtAnchor: 40 },
    },
  ],
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

  it("derives the season number for a Fixed-recurrence entry at its anchor slot", () => {
    const rangeStart = new Date(2026, 7, 2) // 2 Aug 2026 local — the battle-pass anchor date
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: null,
        definitionId: "battle-pass",
        confirmed: false,
        startUtc: "2026-08-02T00:00:00Z",
        endUtc: "2026-09-05T00:00:00Z",
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
    const entry = days.find((day) => day.entries.length > 0)?.entries[0]

    expect(entry?.derivedSeasonNumber).toBe(40)
  })

  it("derives the season number one interval after the anchor", () => {
    const rangeStart = new Date(2026, 8, 6) // 6 Sep 2026 local — one interval (35 days) later
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: null,
        definitionId: "battle-pass",
        confirmed: false,
        startUtc: "2026-09-06T00:00:00Z",
        endUtc: "2026-10-10T00:00:00Z",
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
    const entry = days.find((day) => day.entries.length > 0)?.entries[0]

    expect(entry?.derivedSeasonNumber).toBe(41)
  })

  it("leaves derivedSeasonNumber undefined for None-recurrence and un-configured definitions", () => {
    const rangeStart = new Date(2026, 6, 26)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: new Date(2026, 6, 26).toISOString(),
        endUtc: new Date(2026, 6, 27).toISOString(),
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
    const entry = days.find((day) => day.entries.length > 0)?.entries[0]

    expect(entry?.derivedSeasonNumber).toBeUndefined()
  })

  it("leaves derivedSeasonNumber undefined (not NaN) when a Fixed definition's anchorUtc doesn't parse", () => {
    const rangeStart = new Date(2026, 7, 2)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: null,
        definitionId: "battle-pass-invalid-anchor",
        confirmed: false,
        startUtc: "2026-08-02T00:00:00Z",
        endUtc: "2026-09-05T00:00:00Z",
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
    const entry = days.find((day) => day.entries.length > 0)?.entries[0]

    expect(entry?.derivedSeasonNumber).toBeUndefined()
  })

  it("marks only the first and last local days of a multi-day occurrence", () => {
    const rangeStart = new Date(2026, 7, 2)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: "2026-08-02T00:00:00Z",
        endUtc: "2026-08-06T00:00:00Z",
        parameters: null,
      },
    ]

    const occurrenceDays = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    ).flatMap((day) => day.entries)

    expect(occurrenceDays[0]).toMatchObject({ isOccurrenceStart: true })
    expect(occurrenceDays.at(-1)).toMatchObject({ isOccurrenceEnd: true })
    expect(
      occurrenceDays
        .slice(1, -1)
        .every((entry) => !entry.isOccurrenceStart && !entry.isOccurrenceEnd)
    ).toBe(true)
  })

  it("does not mark one-day recurring modifier occurrences as boundaries", () => {
    const rangeStart = new Date(2026, 7, 2)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-double-xp",
        definitionId: "always-double-xp-sunday",
        confirmed: true,
        startUtc: "2026-08-02T00:00:00Z",
        endUtc: "2026-08-03T00:00:00Z",
        parameters: null,
      },
      {
        occurrenceId: "occ-double-gold",
        definitionId: "always-double-gold-saturday",
        confirmed: true,
        startUtc: "2026-08-08T00:00:00Z",
        endUtc: "2026-08-09T00:00:00Z",
        parameters: null,
      },
    ]

    const modifierEntries = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    ).flatMap((day) => day.entries)

    expect(
      modifierEntries.every(
        (entry) => !entry.isOccurrenceStart && !entry.isOccurrenceEnd
      )
    ).toBe(true)
  })

  it("orders a limited event, a recurring modifier, and a long-running event by daily relevance", () => {
    const rangeStart = new Date(2026, 7, 2)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-battle-pass",
        definitionId: "battle-pass",
        confirmed: true,
        startUtc: "2026-07-11T00:00:00Z",
        endUtc: "2026-08-10T00:00:00Z",
        parameters: null,
      },
      {
        occurrenceId: "occ-double-gold",
        definitionId: "always-double-gold-saturday",
        confirmed: true,
        startUtc: "2026-08-02T00:00:00Z",
        endUtc: "2026-08-03T00:00:00Z",
        parameters: null,
      },
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: "2026-08-02T00:00:00Z",
        endUtc: "2026-08-09T00:00:00Z",
        parameters: null,
      },
    ]

    const firstDayEntries = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    )[0]?.entries

    expect(firstDayEntries?.map((entry) => entry.definitionId)).toEqual([
      "legendary-event",
      "always-double-gold-saturday",
      "battle-pass",
    ])
  })

  it("uses chronological order to break daily-priority ties", () => {
    const rangeStart = new Date(2026, 7, 2)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-later",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: "2026-08-02T12:00:00Z",
        endUtc: "2026-08-03T12:00:00Z",
        parameters: null,
      },
      {
        occurrenceId: "occ-earlier",
        definitionId: "hse-warp-surge",
        confirmed: true,
        startUtc: "2026-08-02T03:00:00Z",
        endUtc: "2026-08-03T03:00:00Z",
        parameters: null,
      },
    ]

    const firstDayEntries = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    )[0]?.entries

    expect(firstDayEntries?.map((entry) => entry.occurrenceId)).toEqual([
      "occ-earlier",
      "occ-later",
    ])
  })
})

describe("sub-24h entries anchored at UTC midnight", () => {
  beforeEach(() => {
    // A positive-offset zone (CEST, UTC+2 in August): UTC midnight lands 2 hours into the next local
    // day, so a naive overlap test would smear a 24h UTC window across two local calendar days —
    // e.g. Double XP/Double Gold, which must show on exactly one weekday.
    vi.stubEnv("TZ", "Europe/Berlin")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("buckets a 24h UTC-midnight entry under exactly one local day", () => {
    const rangeStart = new Date(2026, 7, 9) // 9 Aug 2026 local (Sunday)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-double-xp",
        definitionId: "always-double-xp-sunday",
        confirmed: true,
        startUtc: "2026-08-09T00:00:00Z",
        endUtc: "2026-08-10T00:00:00Z",
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
    const daysWithEntry = days.filter((day) => day.entries.length > 0)

    expect(daysWithEntry).toHaveLength(1)
    expect(daysWithEntry[0]?.date).toBe("2026-08-09")
  })

  it("gives a 24h UTC-midnight entry span 1 in the lane layout", () => {
    const rangeStart = new Date(2026, 7, 9)
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-double-xp",
        definitionId: "always-double-xp-sunday",
        confirmed: true,
        startUtc: "2026-08-09T00:00:00Z",
        endUtc: "2026-08-10T00:00:00Z",
        parameters: null,
      },
    ]

    const lanes = buildEventsCalendarLanes(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    )

    expect(lanes[0]?.entries[0]).toMatchObject({ startColumn: 1, span: 1 })
  })

  it("excludes a sub-24h entry entirely when its true local day falls just before the visible range", () => {
    const rangeStart = new Date(2026, 7, 23) // 23 Aug 2026 local
    const rangeEnd = addLocalDays(rangeStart, 7)
    const entries = [
      {
        occurrenceId: "occ-double-gold",
        definitionId: "always-double-xp-sunday",
        confirmed: true,
        // Local window is [22 Aug 02:00, 23 Aug 02:00) in Europe/Berlin (CEST, UTC+2) — its true local
        // day is the 22nd, one day before the range, even though its tail spills two hours into the
        // 23rd. A naive overlap test would pass this into the visible set via that sliver and then fail
        // every per-day membership test (no day in [23 Aug, 30 Aug) contains its startUtc), producing a
        // degenerate startColumn 0/span 0 entry — regression test for that bug.
        startUtc: "2026-08-22T00:00:00Z",
        endUtc: "2026-08-23T00:00:00Z",
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
    const lanes = buildEventsCalendarLanes(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      rangeStart
    )

    expect(days.every((day) => day.entries.length === 0)).toBe(true)
    expect(lanes.flatMap((lane) => lane.entries)).toHaveLength(0)
  })
})

describe("buildEventsAgenda", () => {
  // Week of Sun 26 Jul – Sat 1 Aug 2026 (local).
  const rangeStart = new Date(2026, 6, 26)
  const rangeEnd = new Date(2026, 7, 2)
  const entry = (
    occurrenceId: string,
    definitionId: string,
    start: Date,
    end: Date
  ) => ({
    occurrenceId,
    definitionId,
    confirmed: true,
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    parameters: null,
  })

  function agendaOf(entries: ReturnType<typeof entry>[]) {
    const days = buildEventsCalendarDays(
      entries,
      definitionsById,
      rangeStart,
      rangeEnd,
      new Date(2026, 6, 26, 12)
    )
    return buildEventsAgenda(days, rangeStart)
  }

  it("lists an event that began before the range once under Ongoing, and again only on its end day", () => {
    // Battle Pass 20 Jul – 29 Jul 00:00 (end exclusive): carried into the week, last day Tue 28 Jul.
    const agenda = agendaOf([
      entry(
        "occ-bp",
        "battle-pass",
        new Date(2026, 6, 20),
        new Date(2026, 6, 29)
      ),
    ])

    expect(agenda.ongoing.map((e) => e.occurrenceId)).toEqual(["occ-bp"])
    expect(agenda.days).toEqual([
      expect.objectContaining({
        date: "2026-07-28",
        entries: [
          expect.objectContaining({
            occurrenceId: "occ-bp",
            isOccurrenceEnd: true,
          }),
        ],
      }),
    ])
  })

  it("shows a multi-day event that starts in the range on its start and end days only", () => {
    // Legendary Event Mon 27 Jul – Fri 31 Jul 00:00: four days (27–30), listed twice instead of four times.
    const agenda = agendaOf([
      entry(
        "occ-le",
        "legendary-event",
        new Date(2026, 6, 27),
        new Date(2026, 6, 31)
      ),
    ])

    expect(agenda.ongoing).toEqual([])
    expect(agenda.days.map((day) => day.date)).toEqual([
      "2026-07-27",
      "2026-07-30",
    ])
    expect(agenda.days[0]?.entries[0]?.isOccurrenceStart).toBe(true)
    expect(agenda.days[1]?.entries[0]?.isOccurrenceEnd).toBe(true)
  })

  it("keeps one-day events on their day and drops empty days", () => {
    const agenda = agendaOf([
      entry(
        "occ-xp",
        "always-double-xp-sunday",
        new Date(2026, 6, 26),
        new Date(2026, 6, 27)
      ),
    ])

    expect(agenda.days.map((day) => day.date)).toEqual(["2026-07-26"])
  })

  it("orders Ongoing by soonest end", () => {
    const agenda = agendaOf([
      entry(
        "occ-bp",
        "battle-pass",
        new Date(2026, 6, 1),
        new Date(2026, 7, 5)
      ),
      entry(
        "occ-le",
        "legendary-event",
        new Date(2026, 6, 22),
        new Date(2026, 6, 28)
      ),
    ])

    expect(agenda.ongoing.map((e) => e.occurrenceId)).toEqual([
      "occ-le",
      "occ-bp",
    ])
  })
})

describe("resolveEventsCalendarRange", () => {
  const today = new Date(2026, 9, 29, 15, 30) // Thu 29 Oct 2026, mid-afternoon local

  it("keeps the week view a rolling 7 days from today, stepped by whole weeks", () => {
    const range = resolveEventsCalendarRange("week", 1, today)

    expect(toIsoDate(range.rangeStart)).toBe("2026-11-05")
    expect(toIsoDate(range.rangeEnd)).toBe("2026-11-12")
    expect(range.gridStart).toEqual(range.rangeStart)
    expect(range.gridEnd).toEqual(range.rangeEnd)
  })

  it("covers the calendar month, padded out to whole Monday-to-Sunday weeks", () => {
    const range = resolveEventsCalendarRange("month", 0, today)

    expect(toIsoDate(range.rangeStart)).toBe("2026-10-01")
    expect(toIsoDate(range.rangeEnd)).toBe("2026-11-01")
    expect(toIsoDate(range.gridStart)).toBe("2026-09-28") // Monday
    expect(toIsoDate(range.gridEnd)).toBe("2026-11-02") // Monday after the 31st
  })

  it("adds no padding week when the month ends on a Sunday", () => {
    // May 2026 ends on Sunday the 31st.
    const range = resolveEventsCalendarRange("month", -5, today)

    expect(toIsoDate(range.rangeStart)).toBe("2026-05-01")
    expect(toIsoDate(range.gridEnd)).toBe("2026-06-01")
  })

  it("pads the month to the device's first day of the week (Sunday)", () => {
    const range = resolveEventsCalendarRange("month", 0, today, 0)

    expect(toIsoDate(range.gridStart)).toBe("2026-09-27") // Sunday
    expect(toIsoDate(range.gridEnd)).toBe("2026-11-01") // Sunday after the 31st (Saturday)
  })

  it("pads the month to the device's first day of the week (Saturday)", () => {
    const range = resolveEventsCalendarRange("month", 0, today, 6)

    expect(toIsoDate(range.gridStart)).toBe("2026-09-26") // Saturday
    expect(toIsoDate(range.gridEnd)).toBe("2026-11-07") // Saturday after the 31st
  })

  it("steps across a year boundary", () => {
    const range = resolveEventsCalendarRange("month", 3, today)

    expect(toIsoDate(range.rangeStart)).toBe("2027-01-01")
    expect(toIsoDate(range.rangeEnd)).toBe("2027-02-01")
  })
})

describe("buildEventsCalendarWeeks", () => {
  it("splits the grid into weeks and continues an event across the week boundary", () => {
    const gridStart = new Date(2026, 6, 27) // Mon 27 Jul 2026
    const gridEnd = new Date(2026, 7, 10) // two weeks later
    const entries = [
      {
        occurrenceId: "occ-lucius",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: new Date(2026, 7, 1).toISOString(), // Sat of week 1
        endUtc: new Date(2026, 7, 5).toISOString(), // Wed of week 2
        parameters: null,
      },
    ]

    const weeks = buildEventsCalendarWeeks(
      entries,
      definitionsById,
      gridStart,
      gridEnd,
      new Date(2026, 6, 27)
    )

    expect(weeks).toHaveLength(2)
    expect(weeks.map((week) => week.days[0]?.date)).toEqual([
      "2026-07-27",
      "2026-08-03",
    ])
    expect(weeks[0]?.lanes[0]?.entries[0]).toMatchObject({
      startColumn: 6,
      span: 2,
    })
    expect(weeks[1]?.lanes[0]?.entries[0]).toMatchObject({
      startColumn: 1,
      span: 2,
    })
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
    // A regression using naive `+24h` arithmetic would land this on both the 8th and the 9th (the
    // entry's raw 24h-later end instant is 2026-03-09T23:00 local, inside the 9th) and still pass the
    // assertion above — this negative assertion is what actually catches that.
    expect(daysWithEntry).not.toContain("2026-03-09")
  })
})

describe("guild seasons", () => {
  const guildDefinitions = new Map([
    [
      "guild-raid-season",
      {
        id: "guild-raid-season",
        type: "GuildRaidSeason",
        recurrence: {
          kind: "Fixed" as const,
          intervalDays: 14,
          durationDays: 13,
          anchorUtc: "2026-10-21T10:00:00Z",
        },
        config: { seasonLengthDays: 13, seasonNumberAtAnchor: 112 },
      },
    ],
    [
      "guild-war-season",
      {
        id: "guild-war-season",
        type: "GuildWarSeason",
        recurrence: {
          kind: "Fixed" as const,
          intervalDays: 35,
          durationDays: 15,
          anchorUtc: "2026-10-23T09:00:00Z",
        },
        config: {
          warsPerSeason: 6,
          preparationPhaseHours: 24,
          activeFightingPhaseHours: 36,
          seasonNumberAtAnchor: 28,
        },
      },
    ],
  ])
  const raid = (startUtc: string, endUtc: string, confirmed = true) => ({
    occurrenceId: null,
    definitionId: "guild-raid-season",
    confirmed,
    startUtc,
    endUtc,
    parameters: null,
  })

  it("adds a break from a raid season's end until the next season starts", () => {
    const { entries, definitionsById: withBreak } = withGuildRaidBreaks(
      [raid("2026-10-21T10:00:00Z", "2026-11-03T10:00:00Z", false)],
      guildDefinitions
    )

    expect(entries).toHaveLength(2)
    expect(entries[1]).toMatchObject({
      definitionId: "guild-raid-break",
      confirmed: false,
      startUtc: "2026-11-03T10:00:00Z",
      endUtc: "2026-11-04T10:00:00.000Z",
    })
    expect(withBreak.get("guild-raid-break")?.type).toBe("GuildRaidBreak")
  })

  it("numbers raid seasons from the anchor and splits a war season into its phases", () => {
    const days = buildEventsCalendarDays(
      [
        raid("2026-11-04T10:00:00Z", "2026-11-17T10:00:00Z"),
        {
          occurrenceId: "occ-gw-28",
          definitionId: "guild-war-season",
          confirmed: true,
          startUtc: "2026-10-23T09:00:00Z",
          endUtc: "2026-11-07T09:00:00Z",
          parameters: { season: 28 },
        },
      ],
      guildDefinitions,
      new Date(2026, 10, 5),
      new Date(2026, 10, 6),
      new Date(2026, 10, 5)
    )
    const entries = days[0]?.entries ?? []
    const raidEntry = entries.find(
      (entry) => entry.definitionId === "guild-raid-season"
    )
    const war = entries.find(
      (entry) => entry.definitionId === "guild-war-season"
    )

    expect(raidEntry?.derivedSeasonNumber).toBe(113)
    expect(war?.derivedSeasonNumber).toBe(28)
    expect(war?.phases).toHaveLength(12)
    expect(war?.phases.slice(0, 2)).toEqual([
      {
        kind: "preparation",
        war: 1,
        startUtc: "2026-10-23T09:00:00.000Z",
        endUtc: "2026-10-24T09:00:00.000Z",
      },
      {
        kind: "war",
        war: 1,
        startUtc: "2026-10-24T09:00:00.000Z",
        endUtc: "2026-10-25T21:00:00.000Z",
      },
    ])
    expect(war?.phases.at(-1)?.endUtc).toBe("2026-11-07T09:00:00.000Z")
  })

  it("keeps raid seasons and their breaks on one timed row", () => {
    const { entries, definitionsById: withBreak } = withGuildRaidBreaks(
      [
        raid("2026-10-21T10:00:00Z", "2026-11-03T10:00:00Z"),
        raid("2026-11-04T10:00:00Z", "2026-11-17T10:00:00Z"),
      ],
      guildDefinitions
    )
    const rangeStart = new Date(2026, 10, 2)
    const lanes = buildEventsCalendarLanes(
      entries,
      withBreak,
      rangeStart,
      new Date(2026, 10, 9),
      rangeStart
    )

    expect(lanes).toHaveLength(1)
    expect(lanes[0]?.timed).toBe(true)
    expect(lanes[0]?.entries.map((entry) => entry.definitionId)).toEqual([
      "guild-raid-season",
      "guild-raid-break",
      "guild-raid-season",
    ])
    const [season, gap, next] = lanes[0]?.entries ?? []
    expect(season?.endOffset).toBeCloseTo(gap?.startOffset ?? -1)
    expect(gap?.endOffset).toBeCloseTo(next?.startOffset ?? -1)
    expect((gap?.endOffset ?? 0) - (gap?.startOffset ?? 0)).toBeCloseTo(1)
  })

  it("marks an entry past once it has ended", () => {
    const days = buildEventsCalendarDays(
      [raid("2026-10-07T10:00:00Z", "2026-10-20T10:00:00Z")],
      guildDefinitions,
      new Date(2026, 9, 10),
      new Date(2026, 9, 11),
      new Date(2026, 9, 29)
    )

    expect(days[0]?.entries[0]?.isPast).toBe(true)
  })
})
