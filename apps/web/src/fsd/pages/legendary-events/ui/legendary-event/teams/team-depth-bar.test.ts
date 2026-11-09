import { describe, expect, it } from "vitest"

import { teamDepthBar } from "./team-depth-bar"

const estimate = (
  depth: number,
  shortfallToNextPct: number | null,
  sureDepth = depth,
  stretchDepth = depth
) => ({
  depth,
  sureDepth,
  stretchDepth,
  battleCount: 18,
  marginAbovePct: 10,
  shortfallToNextPct,
  calibrated: true,
})

describe("teamDepthBar", () => {
  it("is empty without a depth", () => {
    expect(
      teamDepthBar(
        { displayedDepth: null, expectedBattleClears: null, estimate: null },
        18
      )
    ).toEqual({ filled: 0, sure: 0, stretch: 0, total: 18, tone: "none" })
  })

  it("marks a manual depth as manual, whatever the estimate", () => {
    expect(
      teamDepthBar(
        {
          displayedDepth: 9,
          expectedBattleClears: 9,
          estimate: estimate(12, 4),
        },
        18
      )
    ).toEqual({ filled: 9, sure: 9, stretch: 9, total: 18, tone: "manual" })
  })

  it("marks an estimate within 10% of the next battle as close, else as room", () => {
    const at = (shortfall: number | null) =>
      teamDepthBar(
        {
          displayedDepth: 12,
          expectedBattleClears: null,
          estimate: estimate(12, shortfall),
        },
        18
      ).tone
    expect(at(10)).toBe("close")
    expect(at(11)).toBe("room")
    expect(at(null)).toBe("room")
  })

  it("spans the estimate's sure and stretch depths around it", () => {
    expect(
      teamDepthBar(
        {
          displayedDepth: 7,
          expectedBattleClears: null,
          estimate: estimate(7, 40, 6, 8),
        },
        18
      )
    ).toEqual({ filled: 7, sure: 6, stretch: 8, total: 18, tone: "room" })
    expect(
      teamDepthBar(
        {
          displayedDepth: 17,
          expectedBattleClears: null,
          estimate: estimate(17, 40, 16, 20),
        },
        18
      ).stretch
    ).toBe(18)
  })

  it("caps the filled battles at the lane's battle count", () => {
    expect(
      teamDepthBar(
        { displayedDepth: 30, expectedBattleClears: 30, estimate: null },
        18
      ).filled
    ).toBe(18)
  })
})
