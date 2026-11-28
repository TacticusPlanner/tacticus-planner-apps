import { describe, expect, it } from "vitest"

import { eventKeyMonthUtc } from "./event-shop-name.model"

describe("eventKeyMonthUtc", () => {
  it("reads the month and year of an event key", () => {
    expect(eventKeyMonthUtc("December2026")).toBe(Date.UTC(2026, 11, 1))
    expect(eventKeyMonthUtc("January2027")).toBe(Date.UTC(2027, 0, 1))
  })

  it("is null for a key that is not a month and a year", () => {
    expect(eventKeyMonthUtc("Halloween2025")).toBeNull()
    expect(eventKeyMonthUtc("november2026")).toBeNull()
  })
})
