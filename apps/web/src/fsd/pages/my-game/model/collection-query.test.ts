import { describe, expect, it } from "vitest"

import {
  activeUnitFilterCount,
  defaultUnitFilters,
} from "@/features/unit-filters"

import {
  activeFilterCount,
  defaultCollectionQuery,
  isCollectionGrouping,
  isCollectionLayout,
  isCollectionQuickFilter,
  isCollectionSort,
} from "./collection-query"
import type { CollectionQuery } from "./collection-query"

describe("collection query validators", () => {
  it("accept only known values", () => {
    expect(isCollectionSort("shards")).toBe(true)
    expect(isCollectionSort("power")).toBe(true)
    expect(isCollectionSort("level")).toBe(false)
    expect(isCollectionQuickFilter("canAscend")).toBe(true)
    expect(isCollectionQuickFilter("readyToAscend")).toBe(false)
    expect(isCollectionSort(undefined)).toBe(false)
    expect(isCollectionQuickFilter("missingEquipment")).toBe(true)
    expect(isCollectionLayout("roster")).toBe(true)
    expect(isCollectionLayout("gallery")).toBe(false)
    expect(isCollectionGrouping("none")).toBe(true)
    expect(isCollectionGrouping("alliance")).toBe(false)
  })
})

describe("activeFilterCount", () => {
  it("counts nothing for the default query, whatever the sort or view", () => {
    expect(activeFilterCount(defaultCollectionQuery)).toBe(0)
    expect(activeFilterCount({ ...defaultCollectionQuery, sort: "rank" })).toBe(
      0
    )
    expect(
      activeFilterCount({ ...defaultCollectionQuery, view: "roster" })
    ).toBe(0)
    expect(
      activeFilterCount({ ...defaultCollectionQuery, group: "none" })
    ).toBe(0)
  })

  it("counts search, each set filter, the rank range once and the quick filter", () => {
    const query = {
      ...defaultCollectionQuery,
      search: "ti",
      alliance: "Imperial" as const,
      rankMin: "Gold1" as const,
      rankMax: "Diamond3" as const,
      quick: "needToLevel" as const,
    }
    expect(activeFilterCount(query)).toBe(4)
    expect(activeUnitFilterCount(query)).toBe(2)
  })

  it("counts each combat filter, each min/max pair once", () => {
    const query = {
      ...defaultCollectionQuery,
      starsMin: "Legendary:RedThreeStars" as const,
      attack: "ranged" as const,
      hitsMin: 3,
      hitsMax: 4,
      movement: 3,
      rangeMax: 2,
      damageTypes: ["Bolter"],
      traits: ["Psyker", "Flying"],
      shardSources: ["Extremis" as const],
    }
    expect(activeFilterCount(query)).toBe(8)
    expect(activeUnitFilterCount(query)).toBe(8)
  })

  it("clears every panel filter but keeps the search, quick filter, Owned only and view", () => {
    const query: CollectionQuery = {
      search: "ti",
      alliance: "Imperial",
      factions: ["Ultramarines"],
      rarities: ["Epic"],
      rankMin: "Gold1",
      rankMax: "Diamond3",
      starsMin: "Legendary:RedThreeStars",
      starsMax: "Legendary:RedThreeStars",
      hideUnowned: true,
      kind: "character",
      summons: "forced",
      abilityRole: "damage",
      abilityTarget: "aoe",
      abilityAttack: "ranged",
      attack: "ranged",
      hitsMin: 2,
      hitsMax: 4,
      movement: 3,
      rangeMin: 1,
      rangeMax: 2,
      damageTypes: ["Bolter"],
      traits: ["Psyker"],
      shardSources: ["Extremis"],
      quick: "canAscend",
      sort: "rank",
      view: "roster",
      group: "none",
    }
    const cleared = { ...query, ...defaultUnitFilters }
    expect(cleared).toEqual({
      ...defaultCollectionQuery,
      search: "ti",
      hideUnowned: true,
      quick: "canAscend",
      sort: "rank",
      view: "roster",
      group: "none",
    })
    expect(activeUnitFilterCount(cleared)).toBe(0)
    // Clearing again changes nothing.
    expect({ ...cleared, ...defaultUnitFilters }).toEqual(cleared)
  })

  it("does not count Hide unowned as a filter", () => {
    expect(
      activeFilterCount({ ...defaultCollectionQuery, hideUnowned: true })
    ).toBe(0)
  })

  it("ignores a search of whitespace only", () => {
    expect(
      activeFilterCount({ ...defaultCollectionQuery, search: "   " })
    ).toBe(0)
  })
})
