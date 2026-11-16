import { describe, expect, it } from "vitest"

import {
  calendarLiveAndNext,
  calendarWindow,
  calendarWindowEntry,
} from "./calendar-window"

const entry = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
const entries = [
  entry("campaign-event", "2026-10-20T00:00:00Z", "2026-10-25T00:00:00Z"),
  entry("campaign-event", "2026-10-01T00:00:00Z", "2026-10-06T00:00:00Z"),
  entry("campaign-event", "2026-10-10T00:00:00Z", "2026-10-15T00:00:00Z"),
  entry("incursion", "2026-10-02T00:00:00Z", "2026-10-04T00:00:00Z"),
  entry("campaign-event", "not a date", "2026-10-30T00:00:00Z"),
]

describe("calendarWindow", () => {
  it("returns the window running now, end exclusive", () => {
    expect(
      calendarWindow(
        entries,
        "campaign-event",
        Date.parse("2026-10-03T00:00:00Z")
      )
    ).toEqual({
      status: "live",
      startMs: Date.parse("2026-10-01T00:00:00Z"),
      endMs: Date.parse("2026-10-06T00:00:00Z"),
    })
    expect(
      calendarWindow(
        entries,
        "campaign-event",
        Date.parse("2026-10-06T00:00:00Z")
      )
    ).toMatchObject({
      status: "upcoming",
      startMs: Date.parse("2026-10-10T00:00:00Z"),
    })
  })

  it("returns the next to start, else null", () => {
    expect(
      calendarWindow(
        entries,
        "campaign-event",
        Date.parse("2026-10-16T00:00:00Z")
      )
    ).toMatchObject({
      status: "upcoming",
      startMs: Date.parse("2026-10-20T00:00:00Z"),
    })
    expect(
      calendarWindow(
        entries,
        "campaign-event",
        Date.parse("2026-10-26T00:00:00Z")
      )
    ).toBeNull()
  })
})

describe("calendarWindowEntry", () => {
  it("returns the matched entry with its window", () => {
    const quest = {
      ...entry("quest", "2026-11-10T00:00:00Z", "2026-11-13T00:00:00Z"),
      parameters: { featuredCharacterId: "votanChampion" },
    }
    const found = calendarWindowEntry(
      [...entries, quest],
      "quest",
      Date.parse("2026-11-09T00:00:00Z")
    )

    expect(found?.window).toEqual({
      status: "upcoming",
      startMs: Date.parse("2026-11-10T00:00:00Z"),
      endMs: Date.parse("2026-11-13T00:00:00Z"),
    })
    expect(found?.entry).toBe(quest)
  })
})

const quest = (occurrenceId: string, startUtc: string, endUtc: string) => ({
  occurrenceId,
  definitionId: "quest",
  startUtc,
  endUtc,
})

describe("calendarLiveAndNext", () => {
  const first = quest("q1", "2026-11-11T00:00:00Z", "2026-11-14T00:00:00Z")
  const second = quest("q2", "2026-11-25T00:00:00Z", "2026-11-28T00:00:00Z")
  const third = quest("q3", "2026-12-16T00:00:00Z", "2026-12-19T00:00:00Z")

  it("keeps the next one while one runs, and counts a repeated entry once", () => {
    const { live, next } = calendarLiveAndNext(
      [third, first, first, second],
      "quest",
      Date.parse("2026-11-12T00:00:00Z")
    )
    expect(live.map((item) => item.entry.occurrenceId)).toEqual(["q1"])
    expect(next?.entry.occurrenceId).toBe("q2")
  })

  it("is empty for an unknown definition", () => {
    expect(
      calendarLiveAndNext([first], "new-character-event", Date.now())
    ).toEqual({ live: [], next: null })
  })
})
