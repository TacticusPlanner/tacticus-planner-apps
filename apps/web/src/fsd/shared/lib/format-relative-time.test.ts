import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { formatRelativeTime } from "./format-relative-time"

const NOW = new Date("2026-07-12T12:00:00.000Z").getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("formatRelativeTime", () => {
  it("returns null for a null input", () => {
    expect(formatRelativeTime(null, "en")).toBeNull()
  })

  it("returns null for a NaN input", () => {
    expect(formatRelativeTime(Number.NaN, "en")).toBeNull()
  })

  it("renders 'now' for an instant a few seconds in the past", () => {
    expect(formatRelativeTime(NOW - 30_000, "en")).toBe("now")
  })

  it("renders 'now' for an instant a few seconds in the future", () => {
    expect(formatRelativeTime(NOW + 30_000, "en")).toBe("now")
  })

  it("renders a past instant in minutes", () => {
    expect(formatRelativeTime(NOW - 5 * 60_000, "en")).toBe("5 minutes ago")
  })

  it("renders a past instant in hours", () => {
    expect(formatRelativeTime(NOW - 3 * 3_600_000, "en")).toBe("3 hours ago")
  })

  it("renders a past instant in days", () => {
    expect(formatRelativeTime(NOW - 2 * 86_400_000, "en")).toBe("2 days ago")
  })

  // Regression test: the Tacticus API's lastActivityOn is unix milliseconds already. A caller that
  // mistakenly multiplies by 1000 (treating it as unix seconds) produces a timestamp tens of thousands of
  // years in the future — this must render as a (very large) future value, not silently collapse to "now".
  it("renders a genuinely far-future instant as 'in N years', not 'now'", () => {
    const farFuture = NOW + 1000 * 365 * 86_400_000
    const result = formatRelativeTime(farFuture, "en")

    expect(result).not.toBe("now")
    expect(result).toMatch(/^in .*years?$/)
  })

  it("renders a near-future instant in hours as 'in N hours'", () => {
    expect(formatRelativeTime(NOW + 3 * 3_600_000, "en")).toBe("in 3 hours")
  })

  it("treats the exact 60-second boundary as no longer 'now'", () => {
    expect(formatRelativeTime(NOW - 60_000, "en")).toBe("1 minute ago")
  })

  it("treats 59 seconds as still 'now'", () => {
    expect(formatRelativeTime(NOW - 59_000, "en")).toBe("now")
  })
})
