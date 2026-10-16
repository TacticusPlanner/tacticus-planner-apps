import { describe, expect, it } from "vitest"

import { hordeModeTiers } from "@/test/fixtures/horde-mode-tiers"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"

import { clearEstimateConfig, unitHordeMultiplier } from "./clear-estimate"
import {
  buildHordeTierList,
  effectiveHordeMultiplier,
  type HordeTierListFilters,
} from "./horde-tier-list"

const names = new Map<string, string>(
  legendaryEventCharacters.map((unit) => [unit.id, unit.name])
)
const nameOf = (unitId: string) => names.get(unitId) ?? unitId
const NO_FILTERS: HordeTierListFilters = {
  query: "",
  onlyOwned: false,
  alliance: "all",
}

const build = (
  filters: Partial<HordeTierListFilters> = {},
  // null: the roster could not be read.
  roster: { unitId: string }[] | null = [{ unitId: "ultraCalgar" }]
) =>
  buildHordeTierList(
    hordeModeTiers,
    legendaryEventCharacters,
    (roster ?? undefined) as never,
    { ...NO_FILTERS, ...filters },
    nameOf,
    "en"
  )!

const tileNames = (row: { units: { unitId: string }[] }) =>
  row.units.map((tile) => nameOf(tile.unitId))

describe("buildHordeTierList", () => {
  it("reproduces tier S: 1.85, six tiles in multiplier order, all but Bellator overridden", () => {
    const s = build().rows[0]!
    expect(s.tier).toBe("S")
    expect(s.multiplier).toBe(1.85)
    expect(
      s.units.map((tile) => [
        nameOf(tile.unitId),
        tile.multiplier,
        tile.overridden,
      ])
    ).toEqual([
      ["Kariyan", 2, true],
      ["Isabella", 1.95, true],
      ["Sho'syl", 1.9, true],
      ["Bellator", 1.85, false],
      ["Aleph-Null", 1.8, true],
      ["Tan Gi'da", 1.75, true],
    ])
  })

  it("keeps the catalog tier order", () => {
    expect(build().rows.map((row) => row.tier)).toEqual(["S", "A", "B", "C"])
  })

  it("uses the tier's multiplier for a character without one, with no override mark", () => {
    const list = buildHordeTierList(
      {
        tiers: [{ tier: "B", multiplier: 1.25 }],
        characters: [{ unitId: "ultraCalgar", tier: "B" }],
      },
      legendaryEventCharacters,
      undefined,
      NO_FILTERS,
      nameOf
    )!
    expect(list.rows[0]!.units).toEqual([
      {
        unitId: "ultraCalgar",
        multiplier: 1.25,
        overridden: false,
        owned: undefined,
      },
    ])
  })

  it("lists every other catalog character as untiered, by name", () => {
    const { untiered } = build()
    // 21 of the catalog's characters are tiered (fixture: 118 characters).
    expect(untiered).toHaveLength(legendaryEventCharacters.length - 21)
    const sorted = [...untiered].sort((a, b) =>
      nameOf(a.unitId).localeCompare(nameOf(b.unitId), "en")
    )
    expect(untiered).toEqual(sorted)
  })

  it("keeps only owned characters with Only owned, in every row", () => {
    const list = build({ onlyOwned: true })
    expect(tileNames(list.rows[1]!)).toEqual(["Calgar"])
    expect(list.rows[0]!.units).toEqual([])
    expect(list.untiered).toEqual([])
  })

  it("ignores Only owned while the roster is unknown", () => {
    const list = build({ onlyOwned: true }, null)
    expect(list.rows[0]!.units).toHaveLength(6)
    expect(list.rows[0]!.units[0]!.owned).toBeUndefined()
  })

  it("filters by alliance: Xenos leaves Sho'syl and Aleph-Null in S", () => {
    const list = build({ alliance: "Xenos" })
    expect(tileNames(list.rows[0]!)).toEqual(["Sho'syl", "Aleph-Null"])
  })

  it("filters by name", () => {
    expect(tileNames(build({ query: "kari" }).rows[0]!)).toEqual(["Kariyan"])
  })

  it("is null without the dataset", () => {
    expect(
      buildHordeTierList(
        null,
        legendaryEventCharacters,
        undefined,
        NO_FILTERS,
        nameOf
      )
    ).toBeNull()
  })
})

describe("effectiveHordeMultiplier", () => {
  it("is the same rule the clear-estimate config reads", () => {
    const config = clearEstimateConfig(hordeModeTiers)
    for (const { unitId } of hordeModeTiers.characters) {
      expect(unitHordeMultiplier(config, unitId)).toBe(
        effectiveHordeMultiplier(hordeModeTiers, unitId)
      )
    }
    expect(effectiveHordeMultiplier(hordeModeTiers, "bloodDante")).toBeNull()
    expect(unitHordeMultiplier(config, "bloodDante")).toBe(1)
  })
})
