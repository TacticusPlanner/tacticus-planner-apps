import { describe, expect, it } from "vitest"

import { rarityFromStars } from "./rarity-from-stars"

describe("rarityFromStars", () => {
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
    expect(rarityFromStars(stars)).toBe(rarity)
  })

  it("clamps a star index beyond the ladder to Mythic", () => {
    expect(rarityFromStars(99)).toBe("Mythic")
  })
})
