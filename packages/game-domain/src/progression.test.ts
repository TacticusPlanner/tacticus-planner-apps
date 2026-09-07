import { describe, expect, it } from "vitest"

import {
  abilityCapForProgression,
  maxAbilityLevel,
  maxRankForProgression,
  minProgressionForAbilityLevel,
  minProgressionForRank,
  progressionOrder,
  progressionRarity,
  statAtRank,
} from "./progression"

describe("statAtRank", () => {
  it("returns the base stat at Stone1 with no progression", () => {
    expect(statAtRank(100, "Stone1", "Common:None")).toBe(100)
  })

  it("applies the +10%-per-step progression multiplier", () => {
    expect(statAtRank(100, "Stone1", "Common:OneStar")).toBe(110)
    expect(statAtRank(100, "Stone1", "Mythic:MythicWings")).toBe(240)
  })

  it("compounds rank growth and slows after Diamond3", () => {
    expect(statAtRank(100, "Stone2", "Common:None")).toBe(125)
    const diamond3 = statAtRank(100_000, "Diamond3", "Common:None")
    const adamantine1 = statAtRank(100_000, "Adamantine1", "Common:None")
    expect(adamantine1 / diamond3).toBeCloseTo(1.1091, 2)
  })

  it("adds applied-upgrade bonuses using the previous rank", () => {
    expect(statAtRank(100, "Stone2", "Common:None", 1)).toBe(225)
    expect(() => statAtRank(100, "Stone1", "Common:None", 1)).not.toThrow()
  })
})

describe("progression rank limits", () => {
  it("distinguishes repeated star counts at rarity boundaries", () => {
    expect(maxRankForProgression("Common:TwoStars")).toBe("Iron1")
    expect(maxRankForProgression("Uncommon:TwoStars")).toBe("Bronze1")
    expect(maxRankForProgression("Epic:RedThreeStars")).toBe("Gold1")
    expect(maxRankForProgression("Legendary:RedThreeStars")).toBe("Diamond3")
  })

  it("caps max progression at Adamantine2", () => {
    expect(maxRankForProgression("Mythic:MythicWings")).toBe("Adamantine2")
  })

  it("finds the earliest progression for each rank cap", () => {
    for (const rank of [
      "Iron1",
      "Bronze1",
      "Silver1",
      "Gold1",
      "Diamond3",
      "Adamantine2",
    ] as const) {
      const progression = minProgressionForRank(rank)
      expect(maxRankForProgression(progression)).toBe(rank)
    }
    expect(minProgressionForRank("Stone1")).toBe("Common:None")
  })
})

describe("ability level limits", () => {
  it("exposes the Mythic-tier cap as the maximum ability level", () => {
    expect(maxAbilityLevel).toBe(60)
  })

  it("returns the rarity ability cap for a progression", () => {
    expect(abilityCapForProgression("Common:None")).toBe(8)
    expect(abilityCapForProgression("Uncommon:TwoStars")).toBe(17)
    expect(abilityCapForProgression("Epic:RedOneStar")).toBe(35)
    expect(abilityCapForProgression("Mythic:MythicWings")).toBe(60)
  })

  it("finds the lowest progression whose ability cap covers a level", () => {
    expect(minProgressionForAbilityLevel(8)).toBe("Common:None")
    expect(minProgressionForAbilityLevel(17)).toBe("Uncommon:TwoStars")
    expect(minProgressionForAbilityLevel(18)).toBe("Rare:FourStars")
    expect(minProgressionForAbilityLevel(35)).toBe("Epic:RedOneStar")
    expect(minProgressionForAbilityLevel(42)).toBe("Legendary:RedThreeStars")
    expect(minProgressionForAbilityLevel(60)).toBe("Mythic:OneBlueStar")
  })

  it("clamps a level above the Mythic cap to the last progression", () => {
    expect(minProgressionForAbilityLevel(99)).toBe("Mythic:MythicWings")
  })
})

describe("progression values", () => {
  it("extracts rarity and preserves the complete ascension path", () => {
    expect(progressionRarity("Legendary:RedThreeStars")).toBe("Legendary")
    expect(progressionOrder).toHaveLength(20)
    expect(progressionOrder[0]).toBe("Common:None")
    expect(progressionOrder.at(-1)).toBe("Mythic:MythicWings")
  })
})
