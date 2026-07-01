import { describe, expect, it } from "vitest"

import { statAtRank } from "./unit-stats"

describe("statAtRank", () => {
  it("returns the base stat unchanged at Stone1 with no progression", () => {
    expect(statAtRank(100, "Stone1", "None")).toBe(100)
  })

  it("applies the +10%-per-step progression multiplier at a fixed rank", () => {
    expect(statAtRank(100, "Stone1", "OneStar")).toBe(110)
    expect(statAtRank(100, "Stone1", "MythicWings")).toBe(240)
  })

  it("compounds the per-rank growth coefficient before Adamantine1", () => {
    // rank value 1 → 1.25205^1
    expect(statAtRank(100, "Stone2", "None")).toBe(125)
  })

  it("switches to the slower post-Diamond3 growth rate at Adamantine1", () => {
    const diamond3 = statAtRank(100_000, "Diamond3", "None")
    const adamantine1 = statAtRank(100_000, "Adamantine1", "None")
    // Adamantine1 should be ~1.1091x Diamond3, not ~1.25205x.
    expect(adamantine1 / diamond3).toBeCloseTo(1.1091, 2)
  })

  it("adds a per-upgrade bonus based on the previous rank's coefficient", () => {
    // floor(100 * coeff(Stone2) * 1 + 100 * coeff(Stone1) * 1) = floor(125.205 + 100)
    expect(statAtRank(100, "Stone2", "None", 1)).toBe(225)
  })

  it("clamps the previous-rank lookup at Stone1 (no rank below it)", () => {
    expect(() => statAtRank(100, "Stone1", "None", 1)).not.toThrow()
  })
})
