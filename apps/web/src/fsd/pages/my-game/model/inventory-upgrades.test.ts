import { describe, expect, it } from "vitest"
import type { BattleId, Rarity, UpgradeId } from "@workspace/game-domain"

import type { FarmLocation } from "@/shared/lib"

import {
  bestFarmSpots,
  buildUpgradeRows,
  craftableCount,
  filterUpgradeRows,
  groupUpgradeRows,
  heldById,
  recipeTree,
  sortUpgradeRows,
} from "./inventory-upgrades"
import type {
  InventoryUpgradeRow,
  InventoryUpgradeSource,
} from "./inventory-upgrades"
import { DEFAULT_INVENTORY_UPGRADES_QUERY } from "./inventory-upgrades-query"

const id = (value: string) => value as UpgradeId

function upgrade(
  value: string,
  overrides: Partial<InventoryUpgradeSource> = {}
): InventoryUpgradeSource {
  return {
    id: id(value),
    label: value,
    rarity: "Common",
    stat: "Health",
    crafted: false,
    recipe: [],
    farmLocations: [],
    ...overrides,
  }
}

// plate = 2 bolt + 1 sheet; armour = 1 plate + 3 bolt.
const bolt = upgrade("bolt")
const sheet = upgrade("sheet", { stat: "Armour" })
const plate = upgrade("plate", {
  crafted: true,
  rarity: "Uncommon",
  recipe: [
    { material: id("bolt"), count: 2 },
    { material: id("sheet"), count: 1 },
  ],
})
const armour = upgrade("armour", {
  crafted: true,
  rarity: "Rare",
  stat: "Armour",
  recipe: [
    { material: id("plate"), count: 1 },
    { material: id("bolt"), count: 3 },
  ],
})
const catalog = [bolt, sheet, plate, armour]
const byId = new Map(catalog.map((u) => [u.id, u]))
const stock = (entries: Record<string, number>) =>
  new Map(Object.entries(entries).map(([key, amount]) => [id(key), amount]))

function row(
  value: string,
  overrides: Partial<InventoryUpgradeRow> = {}
): InventoryUpgradeRow {
  return {
    id: id(value),
    name: value,
    rarity: "Common",
    stat: "Health",
    crafted: false,
    have: 0,
    need: 0,
    short: 0,
    goalIds: [],
    canCraft: null,
    ...overrides,
  }
}

describe("heldById", () => {
  it("adds up repeated entries", () => {
    expect(
      heldById([
        { upgradeId: "bolt", amount: 2 },
        { upgradeId: "bolt", amount: 3 },
        { upgradeId: "sheet", amount: 1 },
      ])
    ).toEqual(stock({ bolt: 5, sheet: 1 }))
  })
})

describe("craftableCount", () => {
  it("is null for a basic material", () => {
    expect(craftableCount(id("bolt"), stock({ bolt: 9 }), byId)).toBeNull()
  })

  it("is limited by the scarcest part", () => {
    expect(
      craftableCount(id("plate"), stock({ bolt: 7, sheet: 5 }), byId)
    ).toBe(3)
    expect(craftableCount(id("plate"), stock({ bolt: 7 }), byId)).toBe(0)
  })

  it("crafts short crafted parts from their own parts, sharing the stock", () => {
    // One armour: a held plate + 3 bolts; a second: 2 bolts + 1 sheet for a plate, then 3 bolts.
    expect(
      craftableCount(id("armour"), stock({ plate: 1, bolt: 8, sheet: 4 }), byId)
    ).toBe(2)
    expect(
      craftableCount(id("armour"), stock({ bolt: 50, sheet: 3 }), byId)
    ).toBe(3)
  })

  it("stays finite when a recipe's parts all have count 0 (bad catalog data)", () => {
    const free = upgrade("free", {
      crafted: true,
      recipe: [{ material: id("bolt"), count: 0 }],
    })
    const withFree = new Map([...byId, [free.id, free]])
    expect(craftableCount(free.id, stock({ bolt: 4 }), withFree)).toBe(4)
  })
})

describe("buildUpgradeRows", () => {
  it("joins held stock, goal needs and craftable counts, hiding unheld placeholders", () => {
    const placeholder = upgrade("soon", { label: "Coming soon" })
    const heldPlaceholder = upgrade("soon2", { label: "Coming soon" })
    const rows = buildUpgradeRows({
      upgrades: [...catalog, placeholder, heldPlaceholder],
      held: stock({ bolt: 4, sheet: 1, soon2: 1 }),
      needs: new Map([[id("plate"), { need: 3, short: 2, goalIds: ["g1"] }]]),
      name: (value, fallback) => (value === id("bolt") ? "Bolt" : fallback),
    })

    expect(rows.map((r) => r.id)).toEqual([
      "bolt",
      "sheet",
      "plate",
      "armour",
      "soon2",
    ])
    expect(rows[0]).toMatchObject({
      name: "Bolt",
      have: 4,
      need: 0,
      canCraft: null,
    })
    expect(rows[2]).toMatchObject({
      have: 0,
      need: 3,
      short: 2,
      goalIds: ["g1"],
      canCraft: 1,
    })
  })
})

describe("filterUpgradeRows", () => {
  const rows = [
    row("Blade", { rarity: "Epic", stat: "Damage", have: 2 }),
    row("Plate Core", { crafted: true, stat: "Armour", need: 3 }),
    row("Vial", { have: 1, need: 1 }),
  ]
  const names = (query: Partial<typeof DEFAULT_INVENTORY_UPGRADES_QUERY>) =>
    filterUpgradeRows(rows, {
      ...DEFAULT_INVENTORY_UPGRADES_QUERY,
      ...query,
    }).map((r) => r.name)

  it("lets everything through by default", () => {
    expect(names({})).toEqual(["Blade", "Plate Core", "Vial"])
  })

  it("narrows by search, rarity, stat, kind and the chips", () => {
    expect(names({ search: " core " })).toEqual(["Plate Core"])
    expect(names({ rarities: ["Epic"] })).toEqual(["Blade"])
    expect(names({ stats: ["Armour", "Health"] })).toEqual([
      "Plate Core",
      "Vial",
    ])
    expect(names({ kind: "crafted" })).toEqual(["Plate Core"])
    expect(names({ kind: "basic" })).toEqual(["Blade", "Vial"])
    expect(names({ needed: true })).toEqual(["Plate Core", "Vial"])
    expect(names({ owned: true })).toEqual(["Blade", "Vial"])
    expect(names({ owned: true, needed: true })).toEqual(["Vial"])
  })
})

describe("sortUpgradeRows and groupUpgradeRows", () => {
  const rows = [
    row("b-common-armour", { stat: "Armour", short: 1 }),
    row("a-common-health-crafted", { crafted: true, short: 5 }),
    row("c-common-health", { short: 5 }),
    row("d-mythic-damage", { rarity: "Mythic" as Rarity, stat: "Damage" }),
  ]

  it("orders by rarity first, then stat, basic before crafted, then name", () => {
    expect(sortUpgradeRows(rows, "rarity").map((r) => r.name)).toEqual([
      "d-mythic-damage",
      "c-common-health",
      "a-common-health-crafted",
      "b-common-armour",
    ])
  })

  it("orders by name, or by a count highest first with ties in rarity order", () => {
    expect(sortUpgradeRows(rows, "name").map((r) => r.name)).toEqual([
      "a-common-health-crafted",
      "b-common-armour",
      "c-common-health",
      "d-mythic-damage",
    ])
    expect(sortUpgradeRows(rows, "short").map((r) => r.name)).toEqual([
      "c-common-health",
      "a-common-health-crafted",
      "b-common-armour",
      "d-mythic-damage",
    ])
  })

  it("groups by rarity Mythic first, or by stat in the game's order, leaving out empty groups", () => {
    const sorted = sortUpgradeRows(rows, "rarity")
    expect(
      groupUpgradeRows(sorted, "rarity").map((g) => [g.key, g.rows.length])
    ).toEqual([
      ["Mythic", 1],
      ["Common", 3],
    ])
    expect(groupUpgradeRows(sorted, "stat").map((g) => g.key)).toEqual([
      "Health",
      "Damage",
      "Armour",
    ])
    expect(groupUpgradeRows(sorted, "none")).toEqual([
      { kind: "all", key: "all", rows: sorted },
    ])
  })
})

describe("recipeTree", () => {
  it("nests crafted parts with their held counts", () => {
    expect(recipeTree(id("armour"), stock({ bolt: 2 }), byId)).toEqual([
      {
        id: "plate",
        count: 1,
        have: 0,
        parts: [
          { id: "bolt", count: 2, have: 2, parts: [] },
          { id: "sheet", count: 1, have: 0, parts: [] },
        ],
      },
      { id: "bolt", count: 3, have: 2, parts: [] },
    ])
    expect(recipeTree(id("bolt"), stock({}), byId)).toEqual([])
  })
})

const location = (
  battle: string,
  overrides: Partial<FarmLocation> = {}
): FarmLocation => ({
  battleId: battle as BattleId,
  guaranteed: false,
  effectiveRate: null,
  numerator: null,
  denominator: null,
  isMythic: false,
  ...overrides,
})

describe("bestFarmSpots", () => {
  it("ranks by energy per drop and leaves out unknown or never-dropping battles", () => {
    const energy: Record<string, number> = { a: 6, b: 10, c: 5, d: 6 }
    const spots = bestFarmSpots(
      [
        location("a", { effectiveRate: 0.5 }),
        location("b", { guaranteed: true }),
        location("c", { numerator: 1, denominator: 4 }),
        location("d"),
        location("unknown", { guaranteed: true }),
      ],
      (battleId) => energy[battleId],
      2
    )
    expect(spots).toEqual([
      { battleId: "b", energyCost: 10, dropRate: 1, energyPerItem: 10 },
      { battleId: "a", energyCost: 6, dropRate: 0.5, energyPerItem: 12 },
    ])
  })
})
