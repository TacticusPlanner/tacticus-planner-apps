import { describe, expect, it } from "vitest"

import { rarityOrder, rarityRank } from "./rarity"

describe("rarityRank", () => {
  it("ranks rarities by their position in rarityOrder", () => {
    expect(rarityRank("Common")).toBe(0)
    expect(rarityRank("Mythic")).toBe(rarityOrder.length - 1)
  })
})
