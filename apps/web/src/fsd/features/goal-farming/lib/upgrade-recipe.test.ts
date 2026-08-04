import { describe, expect, it } from "vitest"
import {
  unitIdSchema,
  upgradeIdSchema,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"
import {
  aggregateBaseUpgrades,
  aggregateBaseUpgradesWithCraftedInventory,
  aggregateOwnedBaseUpgrades,
  createCraftedInventoryPool,
  removeUpgradeOccurrences,
  rankUpUpgradeIds,
} from "./upgrade-recipe"

const upgradeId = upgradeIdSchema.parse
const ids = (...values: string[]) => values.map((value) => upgradeId(value))

function upgrade(
  id: string,
  recipe: { material: UpgradeId; count: number }[] = []
): FarmingUpgrade {
  return {
    id: upgradeId(id),
    label: id,
    rarity: "Common",
    stat: "Health",
    crafted: recipe.length > 0,
    recipe,
    farmLocations: [],
  }
}

function character(
  ranks: Partial<Record<Rank, UpgradeId[]>>
): FarmingCharacter {
  return {
    id: unitIdSchema.parse("hero1"),
    name: "Hero",
    rankUpUpgrades: Object.entries(ranks).map(([rank, upgradeIds]) => ({
      rank: rank as Rank,
      upgradeIds,
    })),
  }
}

describe("rankUpUpgradeIds", () => {
  const bronze1 = ids("U1", "U2", "U3", "U4", "U5", "U6")
  const bronze2 = ids("U7", "U8", "U9", "U10", "U11", "U12")
  const unit = character({ Bronze1: bronze1, Bronze2: bronze2 })

  it("includes completed ranks and ignores an empty or reversed range", () => {
    expect(rankUpUpgradeIds(unit, "Bronze1", "Bronze2", false)).toEqual(bronze1)
    expect(rankUpUpgradeIds(unit, "Bronze2", "Bronze1", false)).toEqual([])
  })

  it("selects point-five, applied, and top-row-count targets", () => {
    expect(rankUpUpgradeIds(unit, "Bronze1", "Bronze1", true)).toEqual(
      ids("U1", "U3", "U5")
    )
    expect(rankUpUpgradeIds(unit, "Bronze1", "Bronze1", false, 2)).toEqual(
      ids("U1", "U2")
    )
    expect(rankUpUpgradeIds(unit, "Bronze1", "Bronze1", false, 0, 2)).toEqual(
      ids("U1", "U3")
    )
  })
})

describe("base-upgrade aggregation", () => {
  const c = upgrade("C")
  const d = upgrade("D")
  const b = upgrade("B", [{ material: c.id, count: 2 }])
  const a = upgrade("A", [
    { material: b.id, count: 3 },
    { material: d.id, count: 1 },
  ])
  const upgrades = new Map([a, b, c, d].map((item) => [item.id, item]))

  it("expands nested recipes and combines ingredient counts", () => {
    expect(aggregateBaseUpgrades([a.id], upgrades)).toEqual([
      { id: c.id, count: 6 },
      { id: d.id, count: 1 },
    ])
  })

  it("combines applied upgrades with inventory amounts", () => {
    expect(
      aggregateOwnedBaseUpgrades([b.id], [{ id: a.id, amount: 2 }], upgrades)
    ).toEqual([
      { id: c.id, count: 14 },
      { id: d.id, count: 2 },
    ])
  })

  it("stops a cyclic recipe branch without overflowing", () => {
    const x = upgrade("X")
    const y = upgrade("Y")
    x.crafted = true
    x.recipe = [{ material: y.id, count: 1 }]
    y.crafted = true
    y.recipe = [
      { material: x.id, count: 1 },
      { material: c.id, count: 2 },
    ]

    expect(
      aggregateBaseUpgrades(
        [x.id],
        new Map([x, y, c].map((item) => [item.id, item]))
      )
    ).toEqual([{ id: c.id, count: 2 }])
  })

  it("consumes exact top-level and nested crafted inventory before expansion", () => {
    const pool = createCraftedInventoryPool(
      [
        { upgradeId: a.id, amount: 1 },
        { upgradeId: b.id, amount: 1 },
        { upgradeId: c.id, amount: 99 },
      ],
      upgrades
    )

    expect(
      aggregateBaseUpgradesWithCraftedInventory([a.id, a.id], upgrades, pool)
    ).toEqual([
      { id: c.id, count: 4 },
      { id: d.id, count: 1 },
    ])
    expect(pool.get(a.id)).toBe(0)
    expect(pool.get(b.id)).toBe(0)
    expect(pool.has(c.id)).toBe(false)
  })

  it("leaves unrelated crafted stock and loose base inventory untouched", () => {
    const pool = createCraftedInventoryPool(
      [
        { upgradeId: a.id, amount: 2 },
        { upgradeId: c.id, amount: 10 },
      ],
      upgrades
    )

    expect(
      aggregateBaseUpgradesWithCraftedInventory([b.id], upgrades, pool)
    ).toEqual([{ id: c.id, count: 2 }])
    expect(pool.get(a.id)).toBe(2)
    expect(pool.has(c.id)).toBe(false)
  })

  it("removes only matching applied slot occurrences", () => {
    expect(removeUpgradeOccurrences([a.id, b.id, a.id], [a.id])).toEqual([
      b.id,
      a.id,
    ])
  })
})
