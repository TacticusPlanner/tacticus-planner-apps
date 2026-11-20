import { describe, expect, it } from "vitest"

import type { TeamRoster } from "@/entities/team"

import {
  activeFilterCount,
  buildPickerUnits,
  defaultPickerFilters,
  filterPickerUnits,
  pickerFilterOptions,
} from "./unit-picker"
import type { PickerCatalogCharacter, PickerFilters } from "./unit-picker"

const character = (
  id: string,
  overrides: Partial<PickerCatalogCharacter> = {}
): PickerCatalogCharacter => ({
  id,
  faction: "Ultramarines",
  alliance: "Imperial",
  initialRarity: "Common",
  traits: [],
  meleeDamage: "Power",
  meleeHits: 2,
  rangedDamage: null,
  rangedHits: null,
  rangeDistance: null,
  movement: 3,
  activeAbilityDamage: [],
  passiveAbilityDamage: [],
  ...overrides,
})

const characters = [
  character("ultraCalgar", {
    initialRarity: "Legendary",
    traits: ["Terminator"],
    rangedDamage: "Bolter",
    rangedHits: 3,
    rangeDistance: 2,
    movement: 2,
  }),
  character("ultraTitus", { initialRarity: "Epic", meleeHits: 4 }),
  character("adeptCanoness", {
    faction: "Sisterhood",
    initialRarity: "Rare",
    activeAbilityDamage: ["Flame"],
  }),
  character("blackAbaddon", { faction: "BlackLegion", alliance: "Chaos" }),
]
const mows = [
  { id: "ultraDreadnought", faction: "Ultramarines", alliance: "Imperial" },
  { id: "orksRukkatrukk", faction: "Orks", alliance: "Xenos" },
]

const roster: TeamRoster = {
  characters: new Map([
    [
      "ultraCalgar",
      {
        progression: "Legendary:RedFiveStars",
        rank: "Diamond3",
        xpLevel: 50,
        abilityLevels: [50, 45],
      },
    ],
    [
      "ultraTitus",
      {
        progression: "Epic:RedOneStar",
        rank: "Gold1",
        abilityLevels: [30, 30],
      },
    ],
  ]),
  mows: new Map([
    [
      "ultraDreadnought",
      { progression: "Rare:FourStars", abilityLevels: [10, 10] },
    ],
  ]),
}

const build = (withRoster: TeamRoster | null = roster) =>
  buildPickerUnits({
    characters,
    mows,
    roster: withRoster,
    nameOf: (_kind, id) => id,
    searchNamesOf: (id) => (id === "ultraCalgar" ? ["Marneus Calgar"] : []),
  })

const listed = (
  filters: Partial<PickerFilters> = {},
  options: Parameters<typeof filterPickerUnits>[2] = { mows: true }
) =>
  filterPickerUnits(
    build(),
    { ...defaultPickerFilters, ...filters },
    options
  ).map((unit) => unit.id)

describe("picker units", () => {
  it("sorts by rank, then ability levels, then rarity, as V1", () => {
    expect(build().map((unit) => unit.id)).toEqual([
      "ultraCalgar",
      "ultraTitus",
      "ultraDreadnought",
      "adeptCanoness",
      "blackAbaddon",
      "orksRukkatrukk",
    ])
  })

  it("searches by name, id and the game's other names", () => {
    expect(listed({ search: "marneus" })).toEqual(["ultraCalgar"])
    expect(listed({ search: "titus" })).toEqual(["ultraTitus"])
  })

  it("hides locked units when the chip is off", () => {
    expect(listed({ lockedUnits: false })).toEqual([
      "ultraCalgar",
      "ultraTitus",
      "ultraDreadnought",
    ])
  })

  it("lists every unit as available without a synced roster", () => {
    const units = filterPickerUnits(
      build(null),
      { ...defaultPickerFilters, lockedUnits: false },
      { mows: true }
    )
    expect(units).toHaveLength(6)
    expect(units.every((unit) => unit.owned === undefined)).toBe(true)
  })

  it("filters by rank and rarity range", () => {
    expect(listed({ rankMin: "Gold1", rankMax: "Gold3" })).toEqual([
      "ultraTitus",
    ])
    expect(listed({ rarityMin: "Epic" })).toEqual(["ultraCalgar", "ultraTitus"])
    expect(listed({ rarityMax: "Common" })).toEqual([
      "blackAbaddon",
      "orksRukkatrukk",
    ])
  })

  it("filters by faction and alliance, MoWs included", () => {
    expect(listed({ faction: "Ultramarines" })).toEqual([
      "ultraCalgar",
      "ultraTitus",
      "ultraDreadnought",
    ])
    expect(listed({ alliance: "Xenos" })).toEqual(["orksRukkatrukk"])
  })

  it("filters characters by trait, attack type, hits, movement, range and damage type", () => {
    expect(listed({ trait: "Terminator" })).toEqual(["ultraCalgar"])
    expect(listed({ attackType: "ranged" })).toEqual(["ultraCalgar"])
    expect(listed({ attackType: "melee" })).toEqual([
      "ultraTitus",
      "adeptCanoness",
      "blackAbaddon",
    ])
    expect(listed({ minHits: 4 })).toEqual(["ultraTitus"])
    expect(listed({ movement: 2 })).toEqual(["ultraCalgar"])
    expect(listed({ minRange: 2 })).toEqual(["ultraCalgar"])
    expect(listed({ damageType: "Flame" })).toEqual(["adeptCanoness"])
  })

  it("leaves MoWs out while a character-only filter is set, or when the team takes none", () => {
    expect(listed({ movement: 3 })).not.toContain("ultraDreadnought")
    expect(listed({}, { mows: false })).not.toContain("ultraDreadnought")
  })

  it("limits characters to the allowed factions", () => {
    expect(
      listed({}, { mows: false, allowedFactions: new Set(["Sisterhood"]) })
    ).toEqual(["adeptCanoness"])
  })

  it("counts the filters behind the Filters button", () => {
    expect(activeFilterCount(defaultPickerFilters)).toBe(0)
    expect(
      activeFilterCount({
        ...defaultPickerFilters,
        search: "x",
        lockedUnits: false,
        rankMin: "Iron1",
        rankMax: "Gold1",
        faction: "Orks",
      })
    ).toBe(2)
  })

  it("offers each filter's values from the units", () => {
    const options = pickerFilterOptions(build())
    expect(options.alliances).toEqual(["Chaos", "Imperial", "Xenos"])
    expect(options.ranges).toEqual([2])
    expect(options.damageTypes).toContain("Flame")
  })
})
