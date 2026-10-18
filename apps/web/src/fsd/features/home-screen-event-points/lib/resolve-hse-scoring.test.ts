import { describe, expect, it } from "vitest"

import { hseConfig } from "@/test/fixtures/home-screen-event-scoring"

import { hsePlayerTier, resolveHseScoring } from "./resolve-hse-scoring"

describe("resolveHseScoring", () => {
  it("resolves High with power level 62 and a one-blue-star unit (Psyker Boost, final 765)", () => {
    const scoring = resolveHseScoring(
      hseConfig("hse-trait-boost-psyker"),
      null,
      {
        powerLevel: 62,
        hasBlueStarUnit: true,
      }
    )
    expect(scoring?.playerTier).toBe("High")
    expect(scoring?.tier.tier).toBe("High")
    expect(scoring?.tier.milestones.at(-1)?.requiredPoints).toBe(765)
    expect(scoring?.hasTierChoice).toBe(true)
  })

  it("resolves Mid with power level 35 and no blue-star unit (final 605)", () => {
    const scoring = resolveHseScoring(
      hseConfig("hse-trait-boost-psyker"),
      null,
      {
        powerLevel: 35,
        hasBlueStarUnit: false,
      }
    )
    expect(scoring?.tier.tier).toBe("Mid")
    expect(scoring?.tier.milestones.at(-1)?.requiredPoints).toBe(605)
  })

  it("resolves Low below power level 20, even with a blue-star unit", () => {
    expect(hsePlayerTier({ powerLevel: 19, hasBlueStarUnit: true })).toBe("Low")
    expect(hsePlayerTier({ powerLevel: 20, hasBlueStarUnit: false })).toBe(
      "Mid"
    )
    expect(hsePlayerTier({ powerLevel: 20, hasBlueStarUnit: true })).toBe(
      "High"
    )
  })

  it("uses the Default tier of a single-tier run (Faction Focus october-2026)", () => {
    const scoring = resolveHseScoring(
      hseConfig("hse-faction-focus"),
      { hseVariant: "october-2026" },
      { powerLevel: 62, hasBlueStarUnit: true }
    )
    expect(scoring?.variant.variantKey).toBe("october-2026")
    expect(scoring?.tier.tier).toBe("Default")
    expect(scoring?.tier.milestones.at(-1)?.requiredPoints).toBe(1220)
    expect(scoring?.hasTierChoice).toBe(false)
  })

  it("resolves Faction Boost by its target faction, and nothing without one", () => {
    const hse = hseConfig("hse-faction-boost")
    const player = { powerLevel: 62, hasBlueStarUnit: true }
    expect(
      resolveHseScoring(
        hse,
        { targetFactionId: "DarkAngels" },
        player
      )?.tier.milestones.at(-1)?.requiredPoints
    ).toBe(1000)
    expect(resolveHseScoring(hse, null, player)).toBeNull()
  })

  it("falls back to the Default tier when the player is unknown", () => {
    const scoring = resolveHseScoring(
      hseConfig("hse-global-operation-imperator"),
      null,
      null
    )
    expect(scoring?.playerTier).toBeNull()
    expect(scoring?.tier.tier).toBe("Default")
    expect(scoring?.variant.scope).toBe("Global")
  })
})
