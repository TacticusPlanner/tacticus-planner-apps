import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import {
  editRarities,
  editTarget,
  resolveZone,
  zoneRarities,
} from "./attack-target"
import { pickRarity } from "./page-target"
import type { GuildWarAttack } from "./types"

const [seasonA, seasonD] = guildWarFixture

describe("resolveZone", () => {
  it("restores a stored zone the season has", () => {
    expect(resolveZone("Armoury", seasonA)).toBe("Armoury")
  })

  it("restores a stored copy as its kind's first zone", () => {
    expect(resolveZone("Bunker2", seasonA)).toBe("Bunker1")
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

const attack = {
  zoneId: "Armoury",
  slot: 2,
  rarityCap: "Epic",
} as GuildWarAttack

describe("editing an attack's target", () => {
  it("keeps the attack's own zone and slot while nothing changed", () => {
    const rarities = editRarities(seasonA, 5, attack, "Armoury")
    expect(
      editTarget(attack, seasonA, "Armoury", pickRarity(rarities, "Epic"))
    ).toEqual({ zoneId: "Armoury", slot: 2 })
  })

  it("moves to the first slot of a newly picked rarity or zone", () => {
    const rarities = editRarities(seasonA, 5, attack, "Armoury")
    expect(
      editTarget(attack, seasonA, "Armoury", pickRarity(rarities, "Legendary"))
    ).toEqual({ zoneId: "Armoury", slot: 0 })
  })

  it("keeps the attack's cap pickable when the level no longer has it", () => {
    const mythic = { ...attack, rarityCap: "Mythic", slot: 4 } as GuildWarAttack
    expect(editRarities(seasonA, 5, mythic, "Armoury")[0]).toEqual({
      rarity: "Mythic",
      slot: 4,
    })
  })
})

describe("pickRarity", () => {
  it("takes the picked rarity when the zone has it, else the highest", () => {
    const rarities = zoneRarities(seasonA, 5, "Armoury")
    expect(pickRarity(rarities, "Epic")?.rarity).toBe("Epic")
    expect(pickRarity(rarities, "Mythic")?.rarity).toBe("Legendary")
    expect(pickRarity(rarities, undefined)?.rarity).toBe("Legendary")
    expect(pickRarity([], "Epic")).toBeUndefined()
  })
})
