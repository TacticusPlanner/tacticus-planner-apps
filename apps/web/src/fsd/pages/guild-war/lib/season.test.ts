import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import { required } from "@/shared/lib"

import {
  seasonLetter,
  slotRarityCap,
  tierRarityCaps,
  zoneNumber,
  zonesByTier,
  zoneTierId,
} from "./season"

const seasonA = required(guildWarFixture[0], "season A")
const seasonD = required(guildWarFixture[1], "season D")

describe("guild war season rules", () => {
  it("caps Armoury slot 3 at Epic on battlefield level 5", () => {
    expect(zoneTierId(seasonA, 5, "Armoury")).toBe("Elite")
    expect(slotRarityCap(seasonA, 5, "Armoury", 2)).toBe("Epic")
    expect(slotRarityCap(seasonA, 5, "Armoury", 0)).toBe("Legendary")
  })

  it("reads a zone's tier from the level, not the zone", () => {
    expect(zoneTierId(seasonA, 0, "Trenches1")).toBe("Hero")
    expect(zoneTierId(seasonA, 5, "Trenches1")).toBe("Veteran")
  })

  it("has no cap for a zone the season does not have", () => {
    expect(slotRarityCap(seasonA, 5, "ComsStation", 0)).toBeUndefined()
    expect(slotRarityCap(seasonD, 5, "ComsStation", 0)).toBeDefined()
  })

  it("lists every slot's cap of a tier", () => {
    expect(tierRarityCaps(seasonA, "Trooper")).toEqual([
      "Rare",
      "Rare",
      "Uncommon",
      "Uncommon",
      "Uncommon",
    ])
  })

  it("groups zones by tier, lowest tier first, in battlefield order", () => {
    const groups = zonesByTier(seasonA, 5)
    expect(groups.map((group) => group.tierId)).toEqual([
      "Veteran",
      "Elite",
      "Hero",
    ])
    expect(
      required(groups[2], "Hero group").zones.map((zone) => zone.id)
    ).toEqual(["Bunker1", "Bunker2", "HQ"])
    expect(groups.flatMap((group) => group.zones)).toHaveLength(
      seasonA.zones.length
    )
  })

  it("names zones and seasons", () => {
    expect(zoneNumber("Bunker2")).toBe("2")
    expect(zoneNumber("Armoury")).toBe("")
    expect(seasonLetter("guildWarSeasonD")).toBe("D")
    expect(seasonLetter("other")).toBe("other")
  })
})
