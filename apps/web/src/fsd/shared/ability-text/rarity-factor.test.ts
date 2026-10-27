import { describe, expect, it } from "vitest"
import { progressionRulesFixture } from "@workspace/game-catalog/testing"

import { toRarityFactors } from "./rarity-factor"

describe("toRarityFactors", () => {
  it("reads each rarity's ability multiplier as a fraction", () => {
    expect(
      Object.fromEntries(toRarityFactors([progressionRulesFixture]))
    ).toEqual({
      Common: 1,
      Uncommon: 1.2,
      Rare: 1.4,
      Epic: 1.6,
      Legendary: 1.8,
      Mythic: 2,
    })
  })

  it("is empty until the dataset is served", () => {
    expect(toRarityFactors([]).size).toBe(0)
  })
})
