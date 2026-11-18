import { describe, expect, it } from "vitest"

import {
  formatDateRange,
  formatDateRangeParts,
  formatShortDate,
} from "./format-date"

const now = new Date(2026, 10, 18, 12).getTime()

describe("formatShortDate", () => {
  it("leaves the year out for a date in the current year", () => {
    expect(formatShortDate(new Date(2026, 10, 22), "en-US", now)).toBe("Nov 22")
  })

  it("adds the year for a date in another year", () => {
    expect(formatShortDate(new Date(2027, 0, 3), "en-US", now)).toBe(
      "Jan 3, 2027"
    )
  })
})

describe("formatDateRange", () => {
  it("joins two dates of the current year without the year", () => {
    expect(
      formatDateRange(
        new Date(2026, 10, 22),
        new Date(2026, 11, 6),
        "en-US",
        now
      )
    ).toBe("Nov 22 – Dec 6")
  })

  it("adds the year when the range leaves the current year", () => {
    expect(
      formatDateRange(
        new Date(2026, 11, 28),
        new Date(2027, 0, 4),
        "en-US",
        now
      )
    ).toBe("Dec 28, 2026 – Jan 4, 2027")
  })
})

describe("formatDateRangeParts", () => {
  it("gives both ends the year when one end leaves the current year", () => {
    expect(
      formatDateRangeParts(
        new Date(2026, 11, 28),
        new Date(2027, 0, 4),
        "en-US",
        now
      )
    ).toEqual({ start: "Dec 28, 2026", end: "Jan 4, 2027" })
  })
})

describe("invalid dates", () => {
  it("formats as an empty string instead of throwing", () => {
    expect(formatShortDate("not a date", "en-US", now)).toBe("")
    expect(
      formatDateRangeParts(Number.NaN, new Date(2026, 11, 6), "en-US", now)
    ).toEqual({ start: "", end: "Dec 6" })
  })
})
