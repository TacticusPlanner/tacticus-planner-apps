import { describe, expect, it } from "vitest"

import { buildCombinedGoalSpecs, buildReviewItems } from "./goal-spec-builder"

const baseSpecParams = {
  ascensionSuggestion: null,
  rankStart: "Stone1" as const,
  rankEnd: "Stone2" as const,
  rankStartPointFive: false,
  rankEndPointFive: false,
  progressionStart: "Common:None" as const,
  progressionEnd: "Common:OneStar" as const,
  abilityActiveStart: 0,
  abilityActiveEnd: 0,
  abilityPassiveStart: 0,
  abilityPassiveEnd: 0,
  shardsCount: 0,
}

describe("buildReviewItems", () => {
  it("flags an auto-included Unlock and Ascension as suggested, not the user's own selections", () => {
    const items = buildReviewItems(new Set(["Rank"]), true, true)
    expect(items).toEqual([
      { goalType: "Unlock", autoSuggested: true },
      { goalType: "Ascension", autoSuggested: true },
      { goalType: "Rank", autoSuggested: false },
    ])
  })

  it("does not flag Unlock/Ascension as auto-suggested once explicitly toggled", () => {
    const items = buildReviewItems(
      new Set(["Unlock", "Ascension", "Rank"]),
      true,
      true
    )
    expect(items).toEqual([
      { goalType: "Unlock", autoSuggested: false },
      { goalType: "Ascension", autoSuggested: false },
      { goalType: "Rank", autoSuggested: false },
    ])
  })

  it("is empty when nothing is enabled or suggested", () => {
    expect(buildReviewItems(new Set(), false, false)).toEqual([])
  })
})

describe("buildCombinedGoalSpecs", () => {
  it("builds a single Rank spec with no dependencies when nothing else is included", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank"]),
      includesUnlock: false,
      includesAscension: false,
    })

    expect(specs).toHaveLength(1)
    expect(specs[0].goalType).toBe("Rank")
    expect(specs[0].dependsOnIndex).toEqual([])
  })

  it("chains Unlock -> Ascension -> Rank -> Ability by index, in that order", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Unlock", "Ascension", "Rank", "Ability"]),
      includesUnlock: true,
      includesAscension: true,
    })

    expect(specs.map((spec) => spec.goalType)).toEqual([
      "Unlock",
      "Ascension",
      "Rank",
      "Ability",
    ])
    expect(specs[0].dependsOnIndex).toEqual([]) // Unlock
    expect(specs[1].dependsOnIndex).toEqual([0]) // Ascension -> Unlock
    expect(specs[2].dependsOnIndex).toEqual([0, 1]) // Rank -> Unlock, Ascension
    expect(specs[3].dependsOnIndex).toEqual([0]) // Ability -> Unlock only, not Ascension
  })

  it("uses the auto-suggested Ascension target when Ascension wasn't explicitly toggled", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank"]),
      includesUnlock: false,
      includesAscension: true,
      ascensionSuggestion: { start: "Common:None", end: "Epic:RedOneStar" },
    })

    const ascension = specs.find((spec) => spec.goalType === "Ascension")
    expect(ascension?.config.progression).toEqual({
      start: "Common:None",
      end: "Epic:RedOneStar",
    })
  })

  it("prefers the user's own Ascension fields over the suggestion when explicitly toggled", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Ascension", "Rank"]),
      includesUnlock: false,
      includesAscension: true,
      ascensionSuggestion: { start: "Common:None", end: "Epic:RedOneStar" },
      progressionStart: "Rare:FourStars",
      progressionEnd: "Legendary:RedThreeStars",
    })

    const ascension = specs.find((spec) => spec.goalType === "Ascension")
    expect(ascension?.config.progression).toEqual({
      start: "Rare:FourStars",
      end: "Legendary:RedThreeStars",
    })
  })

  it("leaves Shards with no dependency even when Unlock is included", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Unlock", "Shards"]),
      includesUnlock: true,
      includesAscension: false,
      shardsCount: 50,
    })

    const shards = specs.find((spec) => spec.goalType === "Shards")
    expect(shards?.dependsOnIndex).toEqual([])
    expect(shards?.config.shards).toEqual({ count: 50 })
  })
})
