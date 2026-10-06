import { describe, expect, it } from "vitest"

import { formatEstimateDate } from "./format-estimate-date"

describe("formatEstimateDate", () => {
  it("formats an ISO completion date as a locale-aware short date", () => {
    expect(formatEstimateDate("2026-10-11", "en")).toBe("Oct 11")
    expect(formatEstimateDate("2026-10-11", "es")).toContain("11")
  })

  it("renders the calendar day it was given, not a zone-shifted one", () => {
    // The regression this helper exists to prevent: the value names a calendar day, so parsing it
    // as a local instant and formatting in the viewer's zone would render Jan 1 as "Dec 31"
    // anywhere behind UTC. Both the `Date.UTC` parse and the formatter's `timeZone: "UTC"` are
    // what make this assertion hold for every viewer, not only one running in UTC.
    expect(formatEstimateDate("2026-01-01", "en")).toBe("Jan 1")
    expect(formatEstimateDate("2026-12-31", "en")).toBe("Dec 31")
  })

  it("returns null rather than an Invalid Date string", () => {
    expect(formatEstimateDate(null, "en")).toBeNull()
    expect(formatEstimateDate(undefined, "en")).toBeNull()
    expect(formatEstimateDate("", "en")).toBeNull()
    expect(formatEstimateDate("not-a-date", "en")).toBeNull()
  })
})
