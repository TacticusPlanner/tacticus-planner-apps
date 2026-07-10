import { describe, expect, it } from "vitest"

import {
  maxRankForProgression,
  minProgressionForRank,
  progressionOrder,
  progressionRarity,
  progressionStars,
  statAtRank,
} from "./unit-stats"

describe("statAtRank", () => {
  it("returns the base stat unchanged at Stone1 with no progression", () => {
    expect(statAtRank(100, "Stone1", "None")).toBe(100)
  })

  it("applies the +10%-per-step progression multiplier at a fixed rank", () => {
    expect(statAtRank(100, "Stone1", "OneStar")).toBe(110)
    expect(statAtRank(100, "Stone1", "MythicWings")).toBe(240)
  })

  it("compounds the per-rank growth coefficient before Adamantine1", () => {
    // rank value 1 → 1.25205^1
    expect(statAtRank(100, "Stone2", "None")).toBe(125)
  })

  it("switches to the slower post-Diamond3 growth rate at Adamantine1", () => {
    const diamond3 = statAtRank(100_000, "Diamond3", "None")
    const adamantine1 = statAtRank(100_000, "Adamantine1", "None")
    // Adamantine1 should be ~1.1091x Diamond3, not ~1.25205x.
    expect(adamantine1 / diamond3).toBeCloseTo(1.1091, 2)
  })

  it("adds a per-upgrade bonus based on the previous rank's coefficient", () => {
    // floor(100 * coeff(Stone2) * 1 + 100 * coeff(Stone1) * 1) = floor(125.205 + 100)
    expect(statAtRank(100, "Stone2", "None", 1)).toBe(225)
  })

  it("clamps the previous-rank lookup at Stone1 (no rank below it)", () => {
    expect(() => statAtRank(100, "Stone1", "None", 1)).not.toThrow()
  })
})

describe("maxRankForProgression", () => {
  it("caps a fresh Common unit (None/OneStar) at Iron1", () => {
    expect(maxRankForProgression("Common:None")).toBe("Iron1")
    expect(maxRankForProgression("Common:OneStar")).toBe("Iron1")
  })

  it("distinguishes the same star count at two different rarities (rank/rarity correlation)", () => {
    // "TwoStars" is both Common's max and Uncommon's min star count (V1's OrbAscensionCalculator
    // promotes Common:TwoStars → Uncommon:TwoStars at zero added stars) — because Progression
    // carries rarity explicitly, these are two distinct steps with two different max ranks.
    expect(maxRankForProgression("Common:TwoStars")).toBe("Iron1")
    expect(maxRankForProgression("Uncommon:TwoStars")).toBe("Bronze1")

    // Same pattern at the Epic/Legendary boundary ("RedThreeStars").
    expect(maxRankForProgression("Epic:RedThreeStars")).toBe("Gold1")
    expect(maxRankForProgression("Legendary:RedThreeStars")).toBe("Diamond3")
  })

  it("caps a maxed Mythic unit at Adamantine2, the ladder's current max rank", () => {
    expect(maxRankForProgression("Mythic:MythicWings")).toBe("Adamantine2")
  })
})

describe("minProgressionForRank", () => {
  it("is the inverse of maxRankForProgression at each of its output ranks", () => {
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
  })

  it("requires no progression for a rank Common already covers", () => {
    expect(minProgressionForRank("Stone1")).toBe("Common:None")
  })

  // No "falls back to the max progression for a rank beyond Adamantine2" case here: Adamantine3
  // (the only rank that would exercise that fallback) is currently removed from the Rank ladder
  // entirely — see rank.ts's lastRank comment. Reinstate this case once it ships.
})

describe("progressionRarity / progressionStars", () => {
  it("splits a progression step back into its rarity and stars parts", () => {
    expect(progressionRarity("Legendary:RedThreeStars")).toBe("Legendary")
    expect(progressionStars("Legendary:RedThreeStars")).toBe("RedThreeStars")
  })
})

describe("progressionOrder", () => {
  it("walks the same 20-step ascension path as V1's OrbAscensionCalculator.UPGRADE_PATH", () => {
    expect(progressionOrder).toEqual([
      "Common:None",
      "Common:OneStar",
      "Common:TwoStars",
      "Uncommon:TwoStars",
      "Uncommon:ThreeStars",
      "Uncommon:FourStars",
      "Rare:FourStars",
      "Rare:FiveStars",
      "Rare:RedOneStar",
      "Epic:RedOneStar",
      "Epic:RedTwoStars",
      "Epic:RedThreeStars",
      "Legendary:RedThreeStars",
      "Legendary:RedFourStars",
      "Legendary:RedFiveStars",
      "Legendary:OneBlueStar",
      "Mythic:OneBlueStar",
      "Mythic:TwoBlueStars",
      "Mythic:ThreeBlueStars",
      "Mythic:MythicWings",
    ])
  })
})
