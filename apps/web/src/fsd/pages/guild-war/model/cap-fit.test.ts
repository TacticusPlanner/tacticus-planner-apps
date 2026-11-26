import { describe, expect, it } from "vitest"

import type { TeamRosterUnit } from "@/entities/team"

import { capFit, rankCapRarity } from "./cap-fit"

const unit = (overrides: Partial<TeamRosterUnit>): TeamRosterUnit => ({
  progression: "Legendary:RedFiveStars",
  rank: "Silver1",
  xpLevel: 50,
  abilityLevels: [50, 50],
  ...overrides,
})

const mow = (progression: TeamRosterUnit["progression"]) =>
  unit({ progression, rank: undefined })

describe("capFit", () => {
  it("is over a Rare cap only once the rank reaches Epic's Gold 1", () => {
    expect(capFit("character", unit({ rank: "Gold1" }), "Rare")).toEqual({
      fit: "over",
      rarity: "Epic",
    })
    expect(capFit("character", unit({ rank: "Silver3" }), "Rare")).toBeNull()
  })

  it("is under an Epic cap only at or below Rare's Silver 1", () => {
    expect(capFit("character", unit({ rank: "Silver1" }), "Epic")).toEqual({
      fit: "under",
      rarity: "Rare",
    })
    expect(capFit("character", unit({ rank: "Silver3" }), "Epic")).toBeNull()
  })

  it("ignores level and abilities", () => {
    expect(
      capFit(
        "character",
        unit({ rank: "Silver2", xpLevel: 1, abilityLevels: [1, 1] }),
        "Rare"
      )
    ).toBeNull()
  })

  it("is over a Legendary cap from Adamantine 1, and never over Mythic or under Common", () => {
    expect(
      capFit("character", unit({ rank: "Adamantine1" }), "Legendary")
    ).toEqual({ fit: "over", rarity: "Mythic" })
    expect(
      capFit("character", unit({ rank: "Diamond3" }), "Legendary")
    ).toBeNull()
    expect(
      capFit("character", unit({ rank: "Adamantine2" }), "Mythic")
    ).toBeNull()
    expect(capFit("character", unit({ rank: "Stone1" }), "Common")).toBeNull()
  })

  it("judges a Machine of War by its rarity", () => {
    expect(capFit("mow", mow("Epic:RedOneStar"), "Rare")).toEqual({
      fit: "over",
      rarity: "Epic",
    })
    expect(capFit("mow", mow("Rare:RedOneStar"), "Epic")).toEqual({
      fit: "under",
      rarity: "Rare",
    })
    expect(capFit("mow", mow("Epic:RedOneStar"), "Epic")).toBeNull()
  })

  it("is null without a synced unit or a cap", () => {
    expect(capFit("character", undefined, "Rare")).toBeNull()
    expect(capFit("character", unit({}), undefined)).toBeNull()
  })
})

describe("rankCapRarity", () => {
  it("names the lowest cap a rank fits", () => {
    expect(rankCapRarity("Silver3")).toBe("Epic")
    expect(rankCapRarity("Gold1")).toBe("Epic")
    expect(rankCapRarity("Adamantine1")).toBe("Mythic")
  })
})
