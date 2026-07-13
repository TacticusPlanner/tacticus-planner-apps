import { describe, expect, it } from "vitest"
import type { Rarity } from "@workspace/game-domain"

import { rarityClass } from "./rarity"

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
