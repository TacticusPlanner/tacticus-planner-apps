import { describe, expect, it } from "vitest"

import { criticalGoals, daysUntil, goalHref } from "./insights-view"

describe("insights view helpers", () => {
  it("counts whole days to a date, never below zero", () => {
    const today = new Date("2026-10-30T22:15:00Z")
    expect(daysUntil("2026-10-30", today)).toBe(0)
    expect(daysUntil("2026-11-14", today)).toBe(15)
    expect(daysUntil("2026-10-01", today)).toBe(0)
  })

  it("names at most three goals as setting the date", () => {
    expect(criticalGoals(["a", "b", "c", "d"])).toEqual(["a", "b", "c"])
  })

  it("links a goal to its edit dialog on the Goals list", () => {
    expect(goalHref("goal 1")).toBe("/plan/goals?goal=goal%201")
  })
})
