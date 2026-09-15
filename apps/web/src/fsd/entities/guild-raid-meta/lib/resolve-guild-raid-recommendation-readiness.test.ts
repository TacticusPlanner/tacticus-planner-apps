import { progressionAt, rankAt } from "@workspace/game-domain"
import type { GameCatalogGuildRaidMetaRecommendation } from "@workspace/game-catalog"
import { describe, expect, it } from "vitest"

import {
  resolveGuildRaidRecommendationsReadiness,
  type GuildRaidReadinessRoster,
} from "./resolve-guild-raid-recommendation-readiness"
import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"

const requiredRankIndex = 5
const requiredProgressionIndex = 5
const requiredAbilityLevel = 20

const threshold: GuildRaidInvestmentThreshold = {
  progression: progressionAt(requiredProgressionIndex),
  requiredRank: rankAt(requiredRankIndex),
  requiredRankIndex,
  requiredProgressionIndex,
  requiredAbilityLevel,
}

const fullInvestment = {
  rank: rankAt(requiredRankIndex),
  progression: progressionAt(requiredProgressionIndex),
  activeAbilityLevel: requiredAbilityLevel,
  passiveAbilityLevel: requiredAbilityLevel,
}

function heroSlots(heroIds: string[]) {
  return heroIds.map((heroId) => ({
    heroId,
    roleId: heroId === heroIds[0] ? "signature" : "flex",
    essential: heroId === heroIds[0],
    replacementCharacterIds: heroId === heroIds[0] ? [] : [`${heroId}-alt`],
  }))
}

function recommendation(
  id: string,
  kind: string,
  heroIds: string[]
): GameCatalogGuildRaidMetaRecommendation {
  return {
    id,
    kind,
    heroSlots: heroSlots(heroIds),
    mowId: `${id}-mow`,
    mowReplacementIds: [],
    compIds: [],
    efficiency: 1,
  }
}

// Deliberately authored out of alphabetical order — this is the order that must survive.
const recommendations = [
  recommendation("rec-gamma", "gamma", ["g1", "g2", "g3", "g4", "g5"]),
  recommendation("rec-alpha", "alpha", ["a1", "a2", "a3", "a4", "a5"]),
  recommendation("rec-beta", "beta", ["b1", "b2", "b3", "b4", "b5"]),
]

const roster: GuildRaidReadinessRoster = {
  ownedCharacterIds: new Set(["g1", "g2", "a1", "b1", "b3-alt"]),
  ownedMowIds: new Set(["rec-alpha-mow"]),
  investmentByCharacterId: new Map(
    ["g1", "g2", "a1", "b1", "b3-alt"].map((id) => [id, fullInvestment])
  ),
  investmentByMowId: new Map([["rec-alpha-mow", fullInvestment]]),
}

describe("resolveGuildRaidRecommendationsReadiness", () => {
  it("never reorders recommendations, hero slots, or candidate lists", () => {
    const results = resolveGuildRaidRecommendationsReadiness({
      recommendations,
      threshold,
      roster,
    })

    // Recommendation order is authored order, not alphabetical or readiness-ranked.
    expect(results.map((result) => result.recommendation.id)).toEqual([
      "rec-gamma",
      "rec-alpha",
      "rec-beta",
    ])

    for (const result of results) {
      expect(result.heroSlots.map((slot) => slot.heroId)).toEqual(
        result.recommendation.heroSlots.map((slot) => slot.heroId)
      )
    }

    // The beta recommendation's second hero slot has two owned candidates in authored order:
    // the ideal (unowned here) is absent, so only the replacement appears.
    const beta = results.find(
      (result) => result.recommendation.id === "rec-beta"
    )!
    const b3Slot = beta.heroSlots.find((slot) => slot.heroId === "b3")!
    expect(b3Slot.candidates.map((candidate) => candidate.characterId)).toEqual(
      ["b3-alt"]
    )
  })

  it("computes team readiness per recommendation independently, matching its own slots", () => {
    const results = resolveGuildRaidRecommendationsReadiness({
      recommendations,
      threshold,
      roster,
    })

    const gamma = results.find(
      (result) => result.recommendation.id === "rec-gamma"
    )!
    // g1 (signature/essential, owned+invested) + g2 (flex, owned+invested) fill readiness; g3-g5 and
    // the MoW are unowned/unfilled, so team readiness sits well below 100 without being 0.
    expect(gamma.teamReadiness).toBeGreaterThan(0)
    expect(gamma.teamReadiness).toBeLessThan(100)

    const alpha = results.find(
      (result) => result.recommendation.id === "rec-alpha"
    )!
    expect(alpha.mow.owned).toBe(true)
    expect(alpha.mow.readiness).toBe(100)
  })
})
