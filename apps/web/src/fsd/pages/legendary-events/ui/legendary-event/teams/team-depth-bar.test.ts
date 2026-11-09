import { describe, expect, it } from "vitest"

import { depthBandClauses, teamDepthBar } from "./team-depth-bar"

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

describe("depthBandClauses", () => {
  const bar = (sure: number, filled: number, stretch: number) => ({
    filled,
    sure,
    stretch,
    total: 14,
    tone: "room" as const,
  })

  it("is empty when the bands agree or the depth is manual", () => {
    expect(depthBandClauses(bar(10, 10, 10))).toEqual([])
    expect(depthBandClauses({ ...bar(9, 10, 11), tone: "manual" })).toEqual([])
  })

  it("leaves out an at-best band equal to the likely depth", () => {
    expect(depthBandClauses(bar(10, 11, 11))).toEqual([
      { key: "sure", values: { sure: 10 } },
      { key: "likely", values: { battle: 11 } },
    ])
  })

  it("leaves out a likely band equal to the sure depth", () => {
    expect(depthBandClauses(bar(11, 11, 12))).toEqual([
      { key: "sure", values: { sure: 11 } },
      { key: "stretch", values: { stretch: 12 } },
    ])
  })

  it("spans several likely battles and a team sure of none", () => {
    expect(depthBandClauses(bar(0, 2, 3))).toEqual([
      { key: "sureNone", values: {} },
      { key: "likelyRange", values: { from: 1, to: 2 } },
      { key: "stretch", values: { stretch: 3 } },
    ])
  })
})
