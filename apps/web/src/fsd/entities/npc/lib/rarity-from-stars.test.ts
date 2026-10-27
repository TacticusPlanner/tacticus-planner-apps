import { describe, expect, it } from "vitest"
import { progressionRulesFixture } from "@workspace/game-catalog/testing"

import { rarityFromStars, toMaxStarsByRarity } from "./rarity-from-stars"

describe("rarityFromStars", () => {
  const maxStars = toMaxStarsByRarity([progressionRulesFixture])

  it.each([
    [0, "Common"],
    [2, "Common"],
    [3, "Uncommon"],
    [4, "Uncommon"],
    [5, "Rare"],
    [6, "Rare"],
    [7, "Epic"],
    [8, "Epic"],
    [9, "Legendary"],
    [11, "Legendary"],
    [12, "Mythic"],
    [14, "Mythic"],
  ])("maps %i stars to %s", (stars, rarity) => {
    expect(rarityFromStars(stars, maxStars)).toBe(rarity)
  })

  it("clamps a star index beyond the ladder to Mythic", () => {
    expect(rarityFromStars(99, maxStars)).toBe("Mythic")
  })

  it("is undefined until the ladder has loaded", () => {
    expect(rarityFromStars(3, toMaxStarsByRarity([]))).toBeUndefined()
  })
})
