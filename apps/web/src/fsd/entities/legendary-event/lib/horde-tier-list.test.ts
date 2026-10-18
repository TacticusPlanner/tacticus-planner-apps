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
    const config = clearEstimateConfig(hordeModeTiers, null)
    for (const { unitId } of hordeModeTiers.characters) {
      expect(unitHordeMultiplier(config, unitId)).toBe(
        effectiveHordeMultiplier(hordeModeTiers, unitId)
      )
    }
    expect(effectiveHordeMultiplier(hordeModeTiers, "bloodDante")).toBeNull()
    expect(unitHordeMultiplier(config, "bloodDante")).toBe(1)
  })
})

describe("Tier List and estimates on malformed data", () => {
  const malformed = {
    tiers: [
      { tier: "S", multiplier: 1.85 },
      { tier: "B", multiplier: 1.25 },
    ],
    characters: [
      // Unknown tier with its own multiplier: untiered, at that multiplier, everywhere.
      { unitId: "ultraCalgar", tier: "Z", multiplier: 3 },
      // Duplicate unitId: the first entry wins everywhere.
      { unitId: "bloodDante", tier: "S" },
      { unitId: "bloodDante", tier: "B", multiplier: 1.1 },
      // An untiered first entry is not overridden by a later valid one either.
      { unitId: "custoBladeChampion", tier: "Z" },
      { unitId: "custoBladeChampion", tier: "S", multiplier: 2 },
    ],
  }
  const list = buildHordeTierList(
    malformed,
    legendaryEventCharacters,
    undefined,
    NO_FILTERS,
    nameOf
  )!
  const config = clearEstimateConfig(malformed, null)
  const rowOf = (unitId: string) =>
    list.rows.find((row) => row.units.some((tile) => tile.unitId === unitId))
  const isUntiered = (unitId: string) =>
    list.untiered.some((unit) => unit.unitId === unitId)

  it("shows an entry with an unknown tier as Untiered with its own multiplier, as estimates use", () => {
    expect(list.untiered.find((unit) => unit.unitId === "ultraCalgar")).toEqual(
      {
        unitId: "ultraCalgar",
        multiplier: 3,
        overridden: true,
        owned: undefined,
      }
    )
    expect(effectiveHordeMultiplier(malformed, "ultraCalgar")).toBe(3)
    expect(unitHordeMultiplier(config, "ultraCalgar")).toBe(3)
  })

  it("keeps the first entry of a duplicate unitId in both", () => {
    expect(rowOf("bloodDante")?.tier).toBe("S")
    expect(
      rowOf("bloodDante")?.units.find((tile) => tile.unitId === "bloodDante")
        ?.multiplier
    ).toBe(1.85)
    expect(unitHordeMultiplier(config, "bloodDante")).toBe(1.85)
    expect(isUntiered("custoBladeChampion")).toBe(true)
    expect(unitHordeMultiplier(config, "custoBladeChampion")).toBe(1)
  })

  it("agrees for every catalog character", () => {
    for (const { id } of legendaryEventCharacters) {
      const tile = [
        ...list.rows.flatMap((row) => row.units),
        ...list.untiered,
      ].find((unit) => unit.unitId === id)
      expect(unitHordeMultiplier(config, id)).toBe(tile?.multiplier ?? 1)
    }
  })
})
