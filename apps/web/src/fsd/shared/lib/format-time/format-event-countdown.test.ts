import { describe, expect, it } from "vitest"

import { formatEventCountdown } from "./format-event-countdown"

const NOW = Date.parse("2026-10-01T12:00:00Z")
const after = (ms: number) => NOW + ms
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe("formatEventCountdown", () => {
  it("uses whole days from a day out, rounded to the nearest", () => {
    expect(formatEventCountdown(after(5 * DAY), NOW, "en")).toBe("5 days")
    expect(formatEventCountdown(after(5 * DAY + 11 * HOUR), NOW, "en")).toBe(
      "5 days"
    )
    expect(formatEventCountdown(after(5 * DAY + 23 * HOUR), NOW, "en")).toBe(
      "6 days"
    )
    expect(formatEventCountdown(after(DAY), NOW, "en")).toBe("1 day")
  })

  it("uses hours and minutes under a day", () => {
    expect(formatEventCountdown(after(3 * HOUR + 20 * MIN), NOW, "en")).toBe(
      "3 hr 20 min"
    )
    expect(formatEventCountdown(after(23 * HOUR + 59 * MIN), NOW, "en")).toBe(
      "23 hr 59 min"
    )
  })

  it("drops a zero unit", () => {
    expect(formatEventCountdown(after(2 * HOUR), NOW, "en")).toBe("2 hr")
    expect(formatEventCountdown(after(20 * MIN), NOW, "en")).toBe("20 min")
  })

  it("rounds a partial minute up and never shows less than a minute", () => {
    expect(formatEventCountdown(after(20 * MIN + 1), NOW, "en")).toBe("21 min")
    expect(formatEventCountdown(after(5_000), NOW, "en")).toBe("1 min")
    expect(formatEventCountdown(after(-HOUR), NOW, "en")).toBe("1 min")
  })

  it("is localized", () => {
    expect(formatEventCountdown(after(5 * DAY), NOW, "de")).toBe("5 Tage")
    expect(
      formatEventCountdown(after(5 * DAY), NOW, "fr").replace(/\s/g, " ")
    ).toBe("5 jours")
    expect(formatEventCountdown(after(5 * DAY), NOW, "es")).toBe("5 días")
  })
})
