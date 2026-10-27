import { describe, expect, it } from "vitest"

import {
  activeFilterCount,
  activeStandaloneFilterCount,
  defaultCollectionQuery,
  isCollectionAlliance,
  isCollectionAttackType,
  isCollectionKind,
  isCollectionOwnership,
  isCollectionProgression,
  isCollectionQuickFilter,
  isCollectionRank,
  isCollectionRarity,
  isCollectionShardSource,
  isCollectionSort,
} from "./collection-query"

describe("collection query validators", () => {
  it("accept only known values", () => {
    expect(isCollectionSort("shards")).toBe(true)
    expect(isCollectionSort("power")).toBe(false)
    expect(isCollectionQuickFilter("canAscend")).toBe(true)
    expect(isCollectionQuickFilter("readyToAscend")).toBe(false)
    expect(isCollectionAlliance("Xenos")).toBe(true)
    expect(isCollectionAlliance("Neutral")).toBe(false)
    expect(isCollectionOwnership("unowned")).toBe(true)
    expect(isCollectionKind("mow")).toBe(true)
    expect(isCollectionKind("npc")).toBe(false)
    expect(isCollectionRarity("Mythic")).toBe(true)
    expect(isCollectionRarity("mythic")).toBe(false)
    expect(isCollectionRank("Adamantine2")).toBe(true)
    expect(isCollectionRank("Adamantine3")).toBe(false)
    expect(isCollectionSort(undefined)).toBe(false)
    expect(isCollectionQuickFilter("missingEquipment")).toBe(true)
    expect(isCollectionAttackType("ranged")).toBe(true)
    expect(isCollectionAttackType("range")).toBe(false)
    expect(isCollectionShardSource("EliteMirror")).toBe(true)
    expect(isCollectionShardSource("Onslaught")).toBe(false)
    expect(isCollectionProgression("Legendary:RedThreeStars")).toBe(true)
    expect(isCollectionProgression("Legendary")).toBe(false)
  })
})

describe("activeFilterCount", () => {
  it("counts nothing for the default query, whatever the sort", () => {
    expect(activeFilterCount(defaultCollectionQuery)).toBe(0)
    expect(activeFilterCount({ ...defaultCollectionQuery, sort: "rank" })).toBe(
      0
    )
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
    expect(activeStandaloneFilterCount(query)).toBe(2)
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
    expect(activeStandaloneFilterCount(query)).toBe(8)
  })

  it("ignores a search of whitespace only", () => {
    expect(
      activeFilterCount({ ...defaultCollectionQuery, search: "   " })
    ).toBe(0)
  })
})
