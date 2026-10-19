import { describe, expect, it } from "vitest"

import { legendaryEventRunDates, legendaryEventRunGapDays } from "./run-dates"

const uthar = {
  eventStageStartDatesUtc: ["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"],
}
const farsight = {
  eventStageStartDatesUtc: ["2025-12-28T00:00:00Z", "2026-06-21T00:00:00Z"],
}
const bile = { eventStageStartDatesUtc: ["2026-11-08T00:00:00Z"] }

const day = (ms: number | null) =>
  ms === null ? null : new Date(ms).toISOString().slice(0, 10)

describe("legendaryEventRunGapDays", () => {
  it("rounds the median gap up to whole days", () => {
    // 210 and 175 days: median 192.5.
    expect(legendaryEventRunGapDays([uthar, farsight, bile])).toBe(193)
  })

  it("is null without two consecutive announced runs", () => {
    expect(legendaryEventRunGapDays([bile])).toBeNull()
  })
})

describe("legendaryEventRunDates", () => {
  it("estimates Uthar's run 3 and the deadline", () => {
    const dates = legendaryEventRunDates(uthar, 193)
    expect(dates.starts.map((start) => day(start.startMs))).toEqual([
      "2026-03-08",
      "2026-10-04",
      "2027-04-15",
    ])
    expect(dates.starts.map((start) => start.estimated)).toEqual([
      false,
      false,
      true,
    ])
    expect(day(dates.deadlineMs)).toBe("2027-04-22")
    expect(dates.deadlineEstimated).toBe(true)
  })

  it("chains estimates after one announced run", () => {
    const dates = legendaryEventRunDates(bile, 193)
    expect(day(dates.starts[1]!.startMs)).toBe("2027-05-20")
    expect(day(dates.starts[2]!.startMs)).toBe("2027-11-29")
  })

  it("leaves unannounced runs unknown without history", () => {
    const dates = legendaryEventRunDates(bile, null)
    expect(dates.starts[1]!.startMs).toBeNull()
    expect(dates.starts[2]!.startMs).toBeNull()
    expect(dates.deadlineMs).toBeNull()
  })
})
