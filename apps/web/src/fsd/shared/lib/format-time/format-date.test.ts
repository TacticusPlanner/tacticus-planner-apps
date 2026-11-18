import { describe, expect, it } from "vitest"

import { formatDateRange, formatShortDate } from "./format-date"

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
