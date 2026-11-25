import { describe, expect, it } from "vitest"

import {
  activeUnitFilterCount,
  defaultUnitFilters,
  isUnitFilterAlliance,
  isUnitFilterAttackType,
  isUnitFilterKind,
  isUnitFilterProgression,
  isUnitFilterRank,
  isUnitFilterRarity,
  offersUnitFilterField,
  sectionFilterCounts,
} from "./unit-filters"
import type { UnitFilterField } from "./unit-filters"

describe("unit filter validators", () => {
  it("accept only known values", () => {
    expect(isUnitFilterAlliance("Xenos")).toBe(true)
    expect(isUnitFilterAlliance("Neutral")).toBe(false)
    expect(isUnitFilterKind("mow")).toBe(true)
    expect(isUnitFilterKind("npc")).toBe(false)
    expect(isUnitFilterRarity("Mythic")).toBe(true)
    expect(isUnitFilterRarity("mythic")).toBe(false)
    expect(isUnitFilterRank("Adamantine2")).toBe(true)
    expect(isUnitFilterRank("Adamantine3")).toBe(false)
    expect(isUnitFilterAttackType("ranged")).toBe(true)
    expect(isUnitFilterAttackType("range")).toBe(false)
    expect(isUnitFilterProgression("Legendary:RedThreeStars")).toBe(true)
    expect(isUnitFilterProgression("Legendary")).toBe(false)
  })
})

describe("sectionFilterCounts", () => {
  it("counts each section's set filters, a range once", () => {
    const filters = {
      ...defaultUnitFilters,
      alliance: "Chaos" as const,
      kind: "mow" as const,
      rankMin: "Gold1" as const,
      rankMax: "Diamond3" as const,
      hitsMin: 2,
      rangeMax: 3,
      damageTypes: ["Bolter"],
      summons: "forced" as const,
      movement: 3,
    }
    expect(sectionFilterCounts(filters)).toEqual({
      unit: 2,
      progression: 1,
      attack: 3,
      abilities: 1,
      more: 1,
    })
    expect(activeUnitFilterCount(filters)).toBe(8)
  })

  it("is zero everywhere by default", () => {
    expect(Object.values(sectionFilterCounts(defaultUnitFilters))).toEqual([
      0, 0, 0, 0, 0,
    ])
  })
})

const offered = (
  scope: "roster" | "catalog",
  kind: "character" | "mow" | null
) =>
  (
    [
      "alliance",
      "factions",
      "kind",
      "rarities",
      "rank",
      "stars",
      "attack",
      "traits",
      "summons",
      "abilityRole",
    ] as UnitFilterField[]
  ).filter((field) => offersUnitFilterField(field, { scope, kind }))

describe("offersUnitFilterField", () => {
  it("offers every field to Collection", () => {
    expect(offered("roster", null)).toHaveLength(10)
  })

  it("leaves the roster fields and Unit type out of the Library characters list", () => {
    expect(offered("catalog", "character")).toEqual([
      "alliance",
      "factions",
      "rarities",
      "attack",
      "traits",
      "summons",
      "abilityRole",
    ])
  })

  it("leaves the character-only fields out of the Library Machines of War list", () => {
    expect(offered("catalog", "mow")).toEqual([
      "alliance",
      "factions",
      "summons",
      "abilityRole",
    ])
  })
})
