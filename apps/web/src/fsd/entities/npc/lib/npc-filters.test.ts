import { describe, expect, it } from "vitest"
import type { NpcEncounterSource } from "@workspace/game-catalog"

import { buildNpcGroups } from "./build-npc-groups"
import type { NpcEncounter, NpcEncounterLookup } from "./encounters"
import {
  activeNpcFilterCount,
  emptyNpcFilters,
  filterNpcGroups,
  hasActiveNpcFilters,
  matchesNpcFilters,
  matchingEncounterPlaces,
  matchingVariations,
  variationDamageTypes,
} from "./npc-filters"
import { makhotepRecords, npcRecord } from "./npc-fixtures"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const gaussMelee = npcRecord("necroNpc1Warrior", "Necron Warrior", {
  meleeDamage: "Physical",
  traits: ["LivingMetal", "Mechanical"],
})
const gaussRanged = npcRecord("necroNpc1WarriorSurv", "Necron Warrior", {
  meleeDamage: "Physical",
  rangedDamage: "Gauss",
  rangedHits: 2,
  distance: 3,
  traits: ["LivingMetal", "Mechanical"],
})
const termagant = npcRecord("tyranNpc3Termagant", "Termagant", {
  factionId: "Tyranids",
  meleeDamage: "Physical",
  rangedDamage: "Piercing",
  rangedHits: 1,
  distance: 2,
  traits: ["Swarm", "Synapse"],
  activeAbilityDamage: ["Flame"],
})

const groups = buildNpcGroups([gaussMelee, gaussRanged, termagant])
const byName = (g: { name: string }) => g.name

describe("matchesNpcFilters", () => {
  it("matches everything with empty filters", () => {
    expect(matchesNpcFilters(gaussMelee, emptyNpcFilters)).toBe(true)
    expect(hasActiveNpcFilters(emptyNpcFilters)).toBe(false)
    expect(activeNpcFilterCount(emptyNpcFilters)).toBe(0)
  })

  it("filters by faction", () => {
    const filters = { ...emptyNpcFilters, factionId: "Tyranids" }
    expect(matchesNpcFilters(termagant, filters)).toBe(true)
    expect(matchesNpcFilters(gaussMelee, filters)).toBe(false)
  })

  it("filters by damage type across melee, ranged, and ability profiles (all-of)", () => {
    expect(variationDamageTypes(termagant)).toEqual([
      "Physical",
      "Piercing",
      "Flame",
    ])
    expect(
      matchesNpcFilters(termagant, {
        ...emptyNpcFilters,
        damageTypes: ["Flame"],
      })
    ).toBe(true)
    expect(
      matchesNpcFilters(termagant, {
        ...emptyNpcFilters,
        damageTypes: ["Flame", "Gauss"],
      })
    ).toBe(false)
    expect(
      matchesNpcFilters(gaussRanged, {
        ...emptyNpcFilters,
        damageTypes: ["Gauss"],
      })
    ).toBe(true)
  })

  it("filters by trait (all-of)", () => {
    expect(
      matchesNpcFilters(termagant, { ...emptyNpcFilters, traits: ["Swarm"] })
    ).toBe(true)
    expect(
      matchesNpcFilters(termagant, {
        ...emptyNpcFilters,
        traits: ["Swarm", "LivingMetal"],
      })
    ).toBe(false)
  })

  it("combines filters", () => {
    const filters = {
      ...emptyNpcFilters,
      factionId: "Necrons",
      damageTypes: ["Gauss"],
      traits: ["Mechanical"],
    }
    expect(matchesNpcFilters(gaussRanged, filters)).toBe(true)
    expect(matchesNpcFilters(gaussMelee, filters)).toBe(false)
    expect(activeNpcFilterCount(filters)).toBe(3)
  })
})

describe("filterNpcGroups", () => {
  it("lists a group while any variation matches, and narrows its variations", () => {
    const filters = { ...emptyNpcFilters, damageTypes: ["Gauss"] }

    const listed = filterNpcGroups(groups, filters, byName)

    expect(listed.map((g) => g.name)).toEqual(["Necron Warrior"])
    expect(matchingVariations(at(listed, 0), filters).map((v) => v.id)).toEqual(
      ["necroNpc1WarriorSurv"]
    )
  })

  it("searches the resolved display name case-insensitively", () => {
    const filters = { ...emptyNpcFilters, search: "TERMA" }
    expect(filterNpcGroups(groups, filters, byName).map((g) => g.name)).toEqual(
      ["Termagant"]
    )
    const localized = filterNpcGroups(
      groups,
      { ...emptyNpcFilters, search: "krieger" },
      (g) => (g.name === "Necron Warrior" ? "Necronkrieger" : g.name)
    )
    expect(localized.map((g) => g.name)).toEqual(["Necron Warrior"])
  })

  it("returns every group and every variation with empty filters", () => {
    const listed = filterNpcGroups(groups, emptyNpcFilters, byName)
    expect(listed).toHaveLength(2)
    expect(matchingVariations(at(listed, 0), emptyNpcFilters)).toHaveLength(2)
  })

  it("can filter every group out", () => {
    const filters = { ...emptyNpcFilters, factionId: "Orks" }
    expect(filterNpcGroups(groups, filters, byName)).toEqual([])
  })
})

describe("game-mode filter", () => {
  // Makhotep: the LEG variation fights in a Legendary Event, the base unit only in campaigns.
  const makhotep = buildNpcGroups(makhotepRecords)
  const record = (
    npcId: string,
    source: NpcEncounterSource,
    groupId: string
  ): NpcEncounter => ({
    id: `${npcId}|${source}|${groupId}`,
    npcId,
    source,
    groupId,
    battles: [],
  })
  const rows = [
    record("necroBossWardenLEG", "legendaryEvent", "astarLysander"),
    record("necroBossWardenLEG", "campaign", "campaign2"),
    record("necroNpcWarden", "campaign", "campaign1"),
  ]
  const lookup = (running: readonly string[] = []): NpcEncounterLookup => ({
    encountersOf: (id) => rows.filter((row) => row.npcId === id),
    isRunning: (encounter) => running.includes(encounter.groupId),
  })
  const sourcesOf = lookup()
  const legendary = {
    ...emptyNpcFilters,
    gameMode: "legendaryEvent" as const,
  }

  it("narrows the list and the variations to those encountered in the mode", () => {
    const listed = filterNpcGroups(makhotep, legendary, byName, sourcesOf)
    expect(listed.map((g) => g.name)).toEqual(["Makhotep"])
    expect(
      matchingVariations(at(listed, 0), legendary, sourcesOf).map((v) => v.id)
    ).toEqual(["necroBossWardenLEG"])
  })

  it("counts as an active filter", () => {
    expect(activeNpcFilterCount(legendary)).toBe(1)
    expect(hasActiveNpcFilters(legendary)).toBe(true)
  })

  const ids = (filters: typeof emptyNpcFilters, encounters = sourcesOf) =>
    filterNpcGroups(makhotep, filters, byName, encounters).flatMap((group) =>
      matchingVariations(group, filters, encounters).map((v) => v.id)
    )

  it("narrows to one location of the game mode", () => {
    const campaign1 = {
      ...emptyNpcFilters,
      gameMode: "campaign" as const,
      encounterGroup: "campaign1",
    }
    expect(ids(campaign1)).toEqual(["necroNpcWarden"])
    expect(activeNpcFilterCount(campaign1)).toBe(2)
  })

  it("keeps only encounters running now", () => {
    const running = { ...emptyNpcFilters, runningNow: true }
    expect(ids(running, lookup(["astarLysander"]))).toEqual([
      "necroBossWardenLEG",
    ])
    expect(ids(running)).toEqual([])
    expect(activeNpcFilterCount(running)).toBe(1)
  })

  describe("mission count", () => {
    const battle = (battleId: string, count: number | null) => ({
      battleId,
      track: null,
      tier: null,
      number: 1,
      challenge: false,
      role: "enemy" as const,
      rounds: [],
      count,
      levels: [],
    })
    const warden = {
      ...record("necroNpcWarden", "campaign", "c1"),
      battles: [battle("small", 2), battle("big", 3)],
    }
    const leg = {
      ...record("necroBossWardenLEG", "campaign", "c1"),
      battles: [battle("big", 4)],
    }
    const raid = {
      ...record("necroNpcWarden", "guildRaid", "g"),
      battles: [battle("x", null)],
    }
    const records = [warden, leg, raid]
    const encounters: NpcEncounterLookup = {
      encountersOf: (id) => records.filter((row) => row.npcId === id),
      isRunning: () => false,
    }
    const min = (minCount: number) => ({ ...emptyNpcFilters, minCount })

    it("lists only the places where the NPC itself reaches the count", () => {
      expect([...matchingEncounterPlaces(warden, 3)]).toEqual(["big"])
      expect(matchingEncounterPlaces(warden, 4).size).toBe(0)
    })

    it("does not add other NPCs of the battle, even with a unit filter", () => {
      // Battle "big" holds 3 + 4 Necrons, but neither reaches 5 alone.
      expect(ids({ ...min(5), factionId: "Necrons" }, encounters)).toEqual([])
    })

    it("never matches a Guild Raid, which has no counts", () => {
      expect(matchingEncounterPlaces(raid, 1).size).toBe(0)
    })

    it("keeps the variations reaching the count and counts as a filter", () => {
      expect(ids(min(4), encounters)).toEqual(["necroBossWardenLEG"])
      expect(activeNpcFilterCount(min(4))).toBe(1)
    })

    it("offers every place without a count", () => {
      expect(matchingEncounterPlaces(warden, null).size).toBe(2)
    })
  })

  it("needs one encounter to satisfy every encounter filter", () => {
    // The LEG variation has a campaign and a running event, but no running campaign.
    const runningCampaign = {
      ...emptyNpcFilters,
      gameMode: "campaign" as const,
      runningNow: true,
    }
    expect(ids(runningCampaign, lookup(["astarLysander"]))).toEqual([])
  })

  it("matches nothing without encounter data", () => {
    expect(filterNpcGroups(makhotep, legendary, byName)).toEqual([])
    expect(
      matchesNpcFilters(at(at(makhotep, 0).variations, 0), legendary)
    ).toBe(false)
  })
})
