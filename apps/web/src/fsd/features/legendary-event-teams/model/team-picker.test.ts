import { describe, expect, it } from "vitest"

import type {
  LegendaryEventRosterUnit,
  LegendaryEventUnit,
} from "@/entities/legendary-event"
import {
  fixtureCharacter,
  legendaryEventCharacters,
} from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"

import {
  buildPickerTiles,
  filterPickerTiles,
  objectiveChipCounts,
  toggleObjectiveChip,
  type PickerTile,
} from "./team-picker"

// Lysander Alpha: 2 is Flying, 4 is No Resilient. Dante satisfies both (32 + 80 + 40 = 152). The
// catalog has no Resilient flyer on Alpha, so a synthetic one (Flying, Resilient, 5 hits: 32 + 80
// + 85 = 197) stands in for the Flying-only unit that outranks Dante without a chip.
const dante = fixtureCharacter("bloodDante")
const flyer = {
  ...dante,
  id: "resilientFlyer",
  name: "Resilient Flyer",
  meleeHits: 5,
  traits: [...dante.traits, "Resilient"],
} as unknown as LegendaryEventUnit
const alpha = {
  ...lysanderEvent.alpha,
  availableUnitIds: [
    ...lysanderEvent.alpha.availableUnitIds,
    flyer.id as (typeof lysanderEvent.alpha.availableUnitIds)[number],
  ],
}
const units = [
  ...(legendaryEventCharacters as unknown as LegendaryEventUnit[]),
  flyer,
]
const nameOf = (unit: LegendaryEventUnit) => unit.name
const FLYING = 2
const NO_RESILIENT = 4
const ids = (tiles: readonly PickerTile[]): string[] =>
  tiles.map((tile) => tile.unit.id)
const roster = (unitIds: readonly string[]) =>
  unitIds.map((unitId) => ({ unitId })) as LegendaryEventRosterUnit[]

describe("buildPickerTiles with objective chips", () => {
  const plain = buildPickerTiles(alpha, units, undefined, nameOf)
  const flyingOnly = plain.filter(
    (tile) =>
      tile.satisfied.includes(FLYING) && !tile.satisfied.includes(NO_RESILIENT)
  )

  it("keeps today's order and dims nothing without a chip", () => {
    expect(plain.every((tile) => tile.matches)).toBe(true)
    const sorted = [...plain].sort(
      (a, b) =>
        b.pointsPerBattle - a.pointsPerBattle ||
        b.satisfied.length - a.satisfied.length ||
        a.unit.name.localeCompare(b.unit.name)
    )
    expect(ids(plain)).toEqual(ids(sorted))
  })

  it("lists Dante (152, Flying and No Resilient) before a Flying-only unit, which follows dimmed", () => {
    const tiles = buildPickerTiles(alpha, units, undefined, nameOf, [
      FLYING,
      NO_RESILIENT,
    ])
    const dante = tiles.findIndex((tile) => tile.unit.id === "bloodDante")
    expect(tiles[dante]).toMatchObject({ pointsPerBattle: 152, matches: true })
    expect(ids(flyingOnly)).toContain(flyer.id)
    // Without a chip the flyer (197) is listed before Dante.
    expect(ids(plain).indexOf(flyer.id)).toBeLessThan(
      ids(plain).indexOf("bloodDante")
    )
    for (const tile of flyingOnly) {
      const index = tiles.findIndex((entry) => entry.unit.id === tile.unit.id)
      expect(index).toBeGreaterThan(dante)
      expect(tiles[index]!.matches).toBe(false)
    }
    // Every matching unit comes before every other, each group in today's order.
    const firstOther = tiles.findIndex((tile) => !tile.matches)
    expect(tiles.slice(firstOther).every((tile) => !tile.matches)).toBe(true)
    expect(ids(tiles.filter((tile) => tile.matches))).toEqual(
      ids(
        plain.filter(
          (tile) =>
            tile.satisfied.includes(FLYING) &&
            tile.satisfied.includes(NO_RESILIENT)
        )
      )
    )
  })

  it("removes no unit", () => {
    const tiles = buildPickerTiles(alpha, units, undefined, nameOf, [FLYING])
    expect(new Set(ids(tiles))).toEqual(new Set(ids(plain)))
    expect(tiles).toHaveLength(alpha.availableUnitIds.length)
  })

  it("counts per chip the units that pass the search and Only unlocked", () => {
    const flying = plain.filter((tile) => tile.satisfied.includes(FLYING))
    // Own all Flying units but three.
    const owned = roster(ids(flying).slice(3))
    const tiles = buildPickerTiles(alpha, units, owned, nameOf)
    const objectiveIndexes = alpha.unitsRestrictions.map(
      (objective) => objective.index
    )

    const all = filterPickerTiles(tiles, {
      search: "",
      onlyUnlocked: false,
      selected: new Set(),
      nameOf,
    })
    expect(objectiveChipCounts(all, objectiveIndexes).get(FLYING)).toBe(
      flying.length
    )

    const unlocked = filterPickerTiles(tiles, {
      search: "",
      onlyUnlocked: true,
      selected: new Set(),
      nameOf,
    })
    expect(objectiveChipCounts(unlocked, objectiveIndexes).get(FLYING)).toBe(
      flying.length - 3
    )
    expect(unlocked).toHaveLength(flying.length - 3)
  })
})

describe("toggleObjectiveChip", () => {
  it("selects and clears a chip", () => {
    expect(toggleObjectiveChip([], FLYING)).toEqual([FLYING])
    expect(toggleObjectiveChip([FLYING, NO_RESILIENT], FLYING)).toEqual([
      NO_RESILIENT,
    ])
  })
})
