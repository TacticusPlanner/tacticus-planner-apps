import { describe, expect, it } from "vitest"

import { rarityClass, rarityOrder, rarityRank, type Rarity } from "./rarity"

describe("rarityRank", () => {
  it("ranks rarities by their position in rarityOrder", () => {
    expect(rarityRank("Common")).toBe(0)
    expect(rarityRank("Mythic")).toBe(rarityOrder.length - 1)
  })

  it("ranks an unrecognized rarity as not found", () => {
    expect(rarityRank("SomeNewRarity" as Rarity)).toBe(-1)
  })
})

describe("rarityClass", () => {
  it("maps each rarity to its own text-color class", () => {
    expect(rarityClass("Legendary")).toBe("text-[var(--rarity-legendary)]")
    expect(rarityClass("Mythic")).toBe("text-[var(--rarity-mythic)]")
  })

  it("falls back to the Common class for an unrecognized rarity", () => {
    expect(rarityClass("SomeNewRarity" as Rarity)).toBe(
      "text-[var(--rarity-common)]"
    )
  })
})
