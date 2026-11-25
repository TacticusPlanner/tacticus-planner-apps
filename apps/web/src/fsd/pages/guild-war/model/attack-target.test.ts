import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import type { TeamRoster } from "@/entities/team"

import { likelyRarity, resolveZone, zoneRarities } from "./attack-target"

const [seasonA, seasonD] = guildWarFixture

describe("resolveZone", () => {
  it("restores a stored zone the season has", () => {
    expect(resolveZone("Armoury", seasonA)).toBe("Armoury")
  })

  it("clears a zone the season does not have, or before the catalog loads", () => {
    expect(resolveZone("LandingPad1", seasonD)).toBeNull()
    expect(resolveZone("HQ", undefined)).toBeNull()
    expect(resolveZone("", seasonA)).toBeNull()
  })
})

describe("zoneRarities", () => {
  it("lists a zone's caps once each, highest first, with their first slot", () => {
    expect(zoneRarities(seasonA, 5, "Armoury")).toEqual([
      { rarity: "Legendary", slot: 0 },
      { rarity: "Epic", slot: 2 },
    ])
    expect(zoneRarities(seasonA, 5, null)).toEqual([])
  })
})

const roster = (progression: string): TeamRoster =>
  ({
    characters: new Map([["a", { progression }]]),
    mows: new Map(),
  }) as unknown as TeamRoster

describe("likelyRarity", () => {
  const rarities = zoneRarities(seasonA, 5, "Armoury")

  it("takes the lowest cap the lineup fits under", () => {
    const selection = new Map([["a", "character" as const]])
    expect(likelyRarity(rarities, selection, roster("Epic:RedTwoStars"))).toBe(
      "Epic"
    )
    expect(
      likelyRarity(rarities, selection, roster("Legendary:RedFiveStars"))
    ).toBe("Legendary")
  })

  it("takes the highest cap when the lineup is above them all", () => {
    const selection = new Map([["a", "character" as const]])
    expect(
      likelyRarity(rarities, selection, roster("Mythic:OneBlueStar"))
    ).toBe("Legendary")
    expect(likelyRarity([], selection, null)).toBeUndefined()
  })
})
