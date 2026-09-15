import { progressionAt, rankAt } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import {
  resolveGuildRaidHeroReadiness,
  resolveGuildRaidMowReadiness,
} from "./resolve-guild-raid-investment-readiness"
import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"

const requiredRankIndex = 10
const requiredProgressionIndex = 12
const requiredAbilityLevel = 40

const threshold: GuildRaidInvestmentThreshold = {
  progression: progressionAt(requiredProgressionIndex),
  requiredRank: rankAt(requiredRankIndex),
  requiredRankIndex,
  requiredProgressionIndex,
  requiredAbilityLevel,
}

const sufficientInvestment = {
  rank: rankAt(requiredRankIndex),
  progression: progressionAt(requiredProgressionIndex),
  activeAbilityLevel: requiredAbilityLevel,
  passiveAbilityLevel: requiredAbilityLevel,
}

describe("resolveGuildRaidHeroReadiness", () => {
  it("is 0% for an unowned hero, regardless of investment data", () => {
    expect(
      resolveGuildRaidHeroReadiness({
        owned: false,
        investment: sufficientInvestment,
        threshold,
      })
    ).toBe(0)
  })

  it("is 0% for an owned hero with no investment facts", () => {
    expect(
      resolveGuildRaidHeroReadiness({
        owned: true,
        investment: undefined,
        threshold,
      })
    ).toBe(0)
  })

  it("is 100% when every dimension meets or exceeds the threshold", () => {
    expect(
      resolveGuildRaidHeroReadiness({
        owned: true,
        investment: sufficientInvestment,
        threshold,
      })
    ).toBe(100)
  })

  it("caps a dimension that exceeds the threshold rather than letting it inflate the average", () => {
    expect(
      resolveGuildRaidHeroReadiness({
        owned: true,
        investment: {
          ...sufficientInvestment,
          rank: rankAt(requiredRankIndex + 5),
        },
        threshold,
      })
    ).toBe(100)
  })

  it("reflects a rank-only shortfall in isolation", () => {
    const readiness = resolveGuildRaidHeroReadiness({
      owned: true,
      investment: { ...sufficientInvestment, rank: rankAt(0) },
      threshold,
    })
    // rankRatio 0 + progressionRatio 1 + abilityRatio 1, averaged and rounded.
    expect(readiness).toBe(Math.round(((0 + 1 + 1) / 3) * 100))
    expect(readiness).toBeLessThan(100)
  })

  it("reflects a progression-only shortfall in isolation", () => {
    const readiness = resolveGuildRaidHeroReadiness({
      owned: true,
      investment: { ...sufficientInvestment, progression: progressionAt(0) },
      threshold,
    })
    expect(readiness).toBe(
      Math.round(((1 + 0 / requiredProgressionIndex + 1) / 3) * 100)
    )
    expect(readiness).toBeLessThan(100)
  })

  it("reflects an ability-only shortfall in isolation", () => {
    const readiness = resolveGuildRaidHeroReadiness({
      owned: true,
      investment: {
        ...sufficientInvestment,
        activeAbilityLevel: requiredAbilityLevel / 2,
        passiveAbilityLevel: requiredAbilityLevel / 2,
      },
      threshold,
    })
    expect(readiness).toBe(Math.round(((1 + 1 + 0.5) / 3) * 100))
    expect(readiness).toBeLessThan(100)
  })
})

describe("resolveGuildRaidMowReadiness", () => {
  it("is 0% when unowned", () => {
    expect(
      resolveGuildRaidMowReadiness({
        owned: false,
        progression: progressionAt(requiredProgressionIndex),
        threshold,
      })
    ).toBe(0)
  })

  it("is 0% when owned but progression is unavailable", () => {
    expect(
      resolveGuildRaidMowReadiness({
        owned: true,
        progression: undefined,
        threshold,
      })
    ).toBe(0)
  })

  it("is 100% at or above the required progression", () => {
    expect(
      resolveGuildRaidMowReadiness({
        owned: true,
        progression: progressionAt(requiredProgressionIndex + 3),
        threshold,
      })
    ).toBe(100)
  })

  it("is capped, not inflated, below the required progression", () => {
    expect(
      resolveGuildRaidMowReadiness({
        owned: true,
        progression: progressionAt(Math.floor(requiredProgressionIndex / 2)),
        threshold,
      })
    ).toBe(
      Math.round(
        (Math.floor(requiredProgressionIndex / 2) / requiredProgressionIndex) *
          100
      )
    )
  })
})
