import { describe, expect, it } from "vitest"

import { legendaryEventRunDates, legendaryEventRunWindow } from "./run-dates"

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

  it("guesses unannounced runs at the typical gap, never before the earliest", () => {
    const bile = legendaryEventRunDates({
      eventStageStartDatesUtc: ["2026-11-08T00:00:00Z"],
    })
    expect(bile.starts.map((start) => day(start.guessMs))).toEqual([
      "2026-11-08",
      "2027-05-02",
      "2027-10-24",
    ])
    const uthar3 = legendaryEventRunDates(uthar).starts[2]!
    expect(day(uthar3.guessMs)).toBe("2027-03-28")
  })

  it("windows a run from its guess, flagged when not announced", () => {
    const [first, second] = legendaryEventRunDates(uthar).starts
    expect(legendaryEventRunWindow(first!)).toMatchObject({ guessed: false })
    const window = legendaryEventRunWindow(
      legendaryEventRunDates(bile).starts[1]!
    )
    expect(day(window!.startMs)).toBe("2027-05-02")
    expect(day(window!.endMs)).toBe("2027-05-09")
    expect(window!.guessed).toBe(true)
    expect(second!.guessMs).toBe(second!.startMs)
    expect(
      legendaryEventRunWindow(
        legendaryEventRunDates({ eventStageStartDatesUtc: [] }).starts[0]!
      )
    ).toBeNull()
  })
})

describe("legendaryEventRunDates with the catalog", () => {
  const farsight = {
    eventStageStartDatesUtc: ["2025-12-28T00:00:00Z", "2026-06-21T00:00:00Z"],
  }

  it("starts an unannounced run no sooner than the cadence after the latest announced run", () => {
    // The gap and cycle floors both land on 8 Nov 2026, Bile's announced start: Farsight's run 3
    // comes five weeks after it.
    expect(day(legendaryEventRunDates(farsight).starts[2]!.startMs)).toBe(
      "2026-11-08"
    )
    const dates = legendaryEventRunDates(farsight, [uthar, bile, farsight])
    expect(day(dates.starts[2]!.startMs)).toBe("2026-12-13")
    expect(day(dates.starts[2]!.guessMs)).toBe("2026-12-13")
    expect(day(dates.deadlineMs)).toBe("2026-12-20")
  })

  it("leaves announced runs and later estimates alone", () => {
    const dates = legendaryEventRunDates(uthar, [uthar, bile, farsight])
    expect(dates.starts.map((start) => day(start.startMs))).toEqual([
      "2026-03-08",
      "2026-10-04",
      "2027-02-21",
    ])
  })
})
