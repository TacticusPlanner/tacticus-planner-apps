import { describe, expect, it } from "vitest"

import { diffRosters, type DiffUnit } from "@/entities/roster-snapshot"
import type { UnitTileUnit } from "@/entities/unit"

import {
  compareChips,
  compareFocus,
  focusChips,
  itemSlotType,
} from "./compare-chips"
import {
  buildCompareView,
  compareFields,
  parseCompareFields,
  serializeCompareFields,
  teamUnitIdsOf,
} from "./compare-view"

const unit = (unitId: string, name: string): UnitTileUnit =>
  ({
    kind: "character",
    unitId,
    name,
    data: {
      state: "owned",
      progression: "Common:None",
      abilityLevels: [1, 1],
      shards: 0,
      mythicShards: 0,
    },
  }) as UnitTileUnit

const base: DiffUnit = {
  unitId: "x",
  rank: "Stone1",
  progressionIndex: "Common:None",
  abilities: [{ abilityId: "a", level: 1 }],
}

const powers: Record<string, number> = {
  ultraCalgar: 4650,
  ultraTitus: 1200,
  ultraTigurius: 0,
}

const diffs = new Map(
  diffRosters(
    {
      characters: ["ultraCalgar", "ultraTitus", "ultraTigurius"].map(
        (unitId) => ({ ...base, unitId })
      ),
    },
    {
      characters: [
        { ...base, unitId: "ultraTigurius" },
        { ...base, unitId: "ultraTitus", rank: "Stone2" },
        {
          ...base,
          unitId: "ultraCalgar",
          rank: "Stone3",
          abilities: [{ abilityId: "a", level: 6 }],
        },
      ],
    },
    {
      power: (_kind, entry) =>
        entry.rank === "Stone1" ? 0 : (powers[entry.unitId] ?? 0),
    }
  ).map((diff) => [diff.unitId, diff])
)

const units = [
  unit("ultraTigurius", "Tigurius"),
  unit("ultraTitus", "Titus"),
  unit("ultraCalgar", "Calgar"),
]

describe("buildCompareView", () => {
  it("lists changed units by power gain and hides unchanged ones", () => {
    const view = buildCompareView(units, diffs, {
      metric: null,
      teamUnitIds: null,
      order: "gain",
      locale: "en",
    })
    expect(view.changed.map((item) => item.unit.unitId)).toEqual([
      "ultraCalgar",
      "ultraTitus",
    ])
    expect(view.unchanged.map((item) => item.unit.unitId)).toEqual([
      "ultraTigurius",
    ])
    expect(view.summary).toMatchObject({ rankUps: 3, abilityLevels: 5 })
    expect(view.matching).toBe(3)
  })

  it("narrows to a selected metric and keeps the summary", () => {
    const view = buildCompareView(units, diffs, {
      metric: "abilityLevels",
      teamUnitIds: null,
      order: "gain",
      locale: "en",
    })
    expect(view.changed.map((item) => item.unit.unitId)).toEqual([
      "ultraCalgar",
    ])
    expect(view.summary.rankUps).toBe(3)
  })

  it("keeps Collection's order for another sort and applies the event filter", () => {
    const view = buildCompareView(units, diffs, {
      metric: null,
      teamUnitIds: teamUnitIdsOf(
        [
          {
            laneId: "alpha",
            memberUnitIds: ["ultraTitus"],
            reserveUnitId: "ultraCalgar",
          },
          {
            laneId: "beta",
            memberUnitIds: ["ultraTigurius"],
            reserveUnitId: null,
          },
        ],
        "alpha"
      ),
      order: "rank",
      locale: "en",
    })
    expect(view.changed.map((item) => item.unit.unitId)).toEqual([
      "ultraTitus",
      "ultraCalgar",
    ])
    expect(view.matching).toBe(2)
  })
})

describe("compare fields", () => {
  it("defaults to all on and round-trips a selection", () => {
    expect([...parseCompareFields(null)]).toEqual([...compareFields])
    expect([...parseCompareFields("garbage")]).toEqual([...compareFields])
    const some = new Set(["power", "shards"] as const)
    expect([...parseCompareFields(serializeCompareFields(some))]).toEqual([
      "shards",
      "power",
    ])
    expect(parseCompareFields("").size).toBe(0)
  })

  it("hides chips for fields turned off, never progression or rank", () => {
    const calgar = diffs.get("ultraCalgar")!
    expect(
      compareChips(calgar, new Set(compareFields)).map((c) => c.kind)
    ).toEqual(["rank", "ability", "power"])
    expect(compareChips(calgar, new Set()).map((c) => c.kind)).toEqual(["rank"])
  })

  it("gives each changed ability its own chip, with its slot and id", () => {
    const calgar = diffs.get("ultraCalgar")!
    const both = {
      ...calgar,
      abilities: [
        { slot: 0, abilityId: "active", from: 10, to: 12 },
        { slot: 1, abilityId: "passive", from: 8, to: 11 },
      ],
    }
    expect(
      compareChips(both, new Set(["abilities"])).filter(
        (chip) => chip.kind === "ability"
      )
    ).toEqual([
      { kind: "ability", slot: 0, abilityId: "active", from: 10, to: 12 },
      { kind: "ability", slot: 1, abilityId: "passive", from: 8, to: 11 },
    ])
  })
})

describe("chip focus", () => {
  const chips = compareChips(diffs.get("ultraCalgar")!, new Set(compareFields))

  it("follows the selected metric, then a non-default order", () => {
    expect(compareFocus("ascensions", "gain")).toBe("progression")
    expect(compareFocus("power", "rank")).toBe("power")
    expect(compareFocus(null, "rank")).toBe("rank")
    expect(compareFocus(null, "gain")).toBeNull()
  })

  it("moves the focused chip first and dims the rest", () => {
    expect(
      focusChips(chips, "power").map(({ chip, dimmed }) => [chip.kind, dimmed])
    ).toEqual([
      ["power", false],
      ["rank", true],
      ["ability", true],
    ])
  })

  it("leaves the chips alone without a focus or a chip of that kind", () => {
    const plain = chips.map((chip) => ({ chip, dimmed: false }))
    expect(focusChips(chips, null)).toEqual(plain)
    expect(focusChips(chips, "shards")).toEqual(plain)
  })
})

describe("itemSlotType", () => {
  it("reads the slot type from an item id", () => {
    expect(itemSlotType("I_Crit_E002")).toBe("I_Crit")
    expect(itemSlotType("I_Block_C001")).toBe("I_Block")
    expect(itemSlotType("I_Booster_Block_E002")).toBe("I_Booster_Block")
    expect(itemSlotType("R_Booster_Crit_Foo")).toBe("I_Booster_Crit")
    expect(itemSlotType("R_Crit_DawnBlade")).toBe("I_Crit")
    expect(itemSlotType("I_Defensive_M001")).toBe("I_Defensive")
    expect(itemSlotType("Something")).toBeNull()
  })
})
