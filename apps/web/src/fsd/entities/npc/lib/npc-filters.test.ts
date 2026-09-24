import { describe, expect, it } from "vitest"

import { buildNpcGroups } from "./build-npc-groups"
import {
  activeNpcFilterCount,
  emptyNpcFilters,
  filterNpcGroups,
  hasActiveNpcFilters,
  matchesNpcFilters,
  matchingVariations,
  variationDamageTypes,
} from "./npc-filters"
import { npcRecord } from "./npc-fixtures"

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
    expect(matchingVariations(listed[0], filters).map((v) => v.id)).toEqual([
      "necroNpc1WarriorSurv",
    ])
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
    expect(matchingVariations(listed[0], emptyNpcFilters)).toHaveLength(2)
  })

  it("can filter every group out", () => {
    const filters = { ...emptyNpcFilters, factionId: "Orks" }
    expect(filterNpcGroups(groups, filters, byName)).toEqual([])
  })
})
