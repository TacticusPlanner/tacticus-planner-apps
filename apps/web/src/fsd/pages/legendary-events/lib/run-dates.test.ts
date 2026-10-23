import { describe, expect, it } from "vitest"

import { legendaryEventRunDates } from "./run-dates"

const uthar = {
  eventStageStartDatesUtc: ["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"],
}
const bile = { eventStageStartDatesUtc: ["2026-11-08T00:00:00Z"] }

const day = (ms: number | null) =>
  ms === null ? null : new Date(ms).toISOString().slice(0, 10)

describe("legendaryEventRunDates", () => {
  it("estimates Uthar's run 3 at the minimum gap after run 2", () => {
    const dates = legendaryEventRunDates(uthar)
    expect(dates.starts.map((start) => day(start.startMs))).toEqual([
      "2026-03-08",
      "2026-10-04",
      "2027-02-21",
    ])
    expect(dates.starts.map((start) => start.estimated)).toEqual([
      false,
      false,
      true,
    ])
    expect(day(dates.deadlineMs)).toBe("2027-02-28")
    expect(dates.deadlineEstimated).toBe(true)
  })

  it("keeps run 3 the minimum cycle after run 1", () => {
    // Run 2 140 days after run 1 would put run 3 at 280 days: the cycle floor moves it to 315.
    const dates = legendaryEventRunDates(bile)
    expect(day(dates.starts[1]!.startMs)).toBe("2027-03-28")
    expect(day(dates.starts[2]!.startMs)).toBe("2027-09-19")
    expect(dates.starts[2]!.estimated).toBe(true)
  })

  it("leaves every run unknown without an announced first run", () => {
    const dates = legendaryEventRunDates({ eventStageStartDatesUtc: [] })
    expect(dates.starts.every((start) => start.startMs === null)).toBe(true)
    expect(dates.deadlineMs).toBeNull()
  })
})
