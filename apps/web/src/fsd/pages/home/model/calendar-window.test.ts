import { describe, expect, it } from "vitest"

import { calendarWindow } from "./calendar-window"

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
