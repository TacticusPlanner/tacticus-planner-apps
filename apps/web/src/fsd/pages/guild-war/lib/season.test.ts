import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import { required } from "@/shared/lib"

import {
  playedLevels,
  seasonLetter,
  startLevel,
  slotRarityCap,
  tierRarityCaps,
  zoneKindId,
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

  it("groups zone kinds by tier, lowest tier first, each kind once", () => {
    const groups = zonesByTier(seasonA, 5)
    expect(groups.map((group) => group.tierId)).toEqual([
      "Veteran",
      "Elite",
      "Hero",
    ])
    // Frontline 1 to 3 and Bunker 1 and 2 are one pick each, as their first copy.
    expect(
      required(groups[0], "Veteran group").zones.map((zone) => zone.id)
    ).toContain("Trenches1")
    expect(
      required(groups[0], "Veteran group").zones.map((zone) => zone.id)
    ).not.toContain("Trenches2")
    expect(
      required(groups[2], "Hero group").zones.map((zone) => zone.id)
    ).toEqual(["Bunker1", "HQ"])
  })

  it("stands a zone's copies for its first one", () => {
    expect(zoneKindId(seasonA, "Trenches3")).toBe("Trenches1")
    expect(zoneKindId(seasonA, "Bunker2")).toBe("Bunker1")
    expect(zoneKindId(seasonA, "Armoury")).toBe("Armoury")
    expect(zoneKindId(undefined, "Bunker2")).toBe("Bunker2")
  })

  it("names seasons by letter", () => {
    expect(seasonLetter("guildWarSeasonD")).toBe("D")
    expect(seasonLetter("other")).toBe("other")
  })

  it("never offers or starts at level 0, the game's not taking part", () => {
    expect(playedLevels(seasonA)).toEqual([1, 2, 3, 4, 5])
    expect(startLevel(seasonA)).toBe(1)
    expect(startLevel(seasonA, 4)).toBe(4)
    expect(startLevel(seasonA, 0)).toBe(1)
  })
})
