import { describe, expect, it } from "vitest"

import {
  clampItemLevel,
  compareByRarityThenLevel,
  itemChanceAt,
  itemStatsAt,
  reclaimValue,
  upgradeCost,
} from "./item-levels"
import type { LadderItem } from "./item-levels"

const step = (
  goldCost: number,
  salvageCost: number,
  mythicSalvageCost = 0
) => ({
  goldCost,
  salvageCost,
  mythicSalvageCost,
})

/** The game's Epic ladder (every Epic item shares it at v1.44). */
const epicKnife: LadderItem = {
  rarity: "Epic",
  levels: Array.from({ length: 9 }, (_, index) => ({
    stats: { critChance: 35, critDamage: 202 + index * 51 },
  })),
  upgradeLevels: [
    step(0, 150),
    step(750, 90),
    step(1000, 120),
    step(1250, 150),
    step(1500, 200),
    step(1750, 250),
    step(2000, 300),
    step(2250, 350),
    step(2500, 400),
  ],
}

/** The game's Legendary ladder. */
const legendary: LadderItem = {
  rarity: "Legendary",
  levels: Array.from({ length: 11 }, () => ({ stats: { blockChance: 30 } })),
  upgradeLevels: [
    step(0, 400),
    step(2000, 250),
    step(3000, 350),
    step(4000, 450),
    step(6000, 600),
    step(8000, 800),
    step(10_000, 1000),
    step(15_000, 1250),
    step(20_000, 1500),
    step(30_000, 2000),
    step(50_000, 3000),
  ],
}

/** The game's Mythic ladder: Mythic salvage, never plain salvage. */
const mythicRelic: LadderItem = {
  rarity: "Mythic",
  levels: Array.from({ length: 10 }, () => ({ stats: { armor: 100, hp: 50 } })),
  upgradeLevels: [
    step(0, 0, 100),
    step(50_000, 0, 50),
    step(60_000, 0, 75),
    step(70_000, 0, 100),
    step(85_000, 0, 125),
    step(100_000, 0, 150),
    step(125_000, 0, 200),
    step(150_000, 0, 300),
    step(175_000, 0, 500),
    step(200_000, 0, 1000),
  ],
}

describe("reclaimValue", () => {
  it("returns the level-1 salvage plus the salvage spent upgrading (Epic Lv 3 = 360)", () => {
    expect(reclaimValue(epicKnife, 3)).toEqual({
      gold: 1750,
      salvage: 360,
      mythicSalvage: 0,
    })
  })

  it("returns a level-1 item's own salvage and no gold", () => {
    expect(reclaimValue(epicKnife, 1)).toEqual({
      gold: 0,
      salvage: 150,
      mythicSalvage: 0,
    })
  })

  it("adds up a maxed Legendary item", () => {
    expect(reclaimValue(legendary, 11)).toEqual({
      gold: 148_000,
      salvage: 11_600,
      mythicSalvage: 0,
    })
  })

  it("pays Mythic salvage for a Mythic item", () => {
    expect(reclaimValue(mythicRelic, 10)).toEqual({
      gold: 1_015_000,
      salvage: 0,
      mythicSalvage: 2600,
    })
  })
})

describe("upgradeCost", () => {
  it("sums the steps above the current level", () => {
    expect(upgradeCost(epicKnife, 3, 4)).toEqual({
      gold: 1250,
      salvage: 150,
      mythicSalvage: 0,
    })
    expect(upgradeCost(epicKnife, 1, 9)).toEqual({
      gold: 13_000,
      salvage: 1860,
      mythicSalvage: 0,
    })
  })

  it("costs nothing at or above the target", () => {
    expect(upgradeCost(epicKnife, 9, 9)).toEqual({
      gold: 0,
      salvage: 0,
      mythicSalvage: 0,
    })
    expect(upgradeCost(epicKnife, 5, 2).gold).toBe(0)
  })
})

describe("levels and stats", () => {
  it("clamps a level to the ladder", () => {
    expect(clampItemLevel(epicKnife, 0)).toBe(1)
    expect(clampItemLevel(epicKnife, 42)).toBe(9)
  })

  it("reads the stats and chance at a level", () => {
    expect(itemStatsAt(epicKnife, 2)).toEqual({
      critChance: 35,
      critDamage: 253,
    })
    expect(itemChanceAt(legendary, 4)).toBe(30)
    expect(itemChanceAt(mythicRelic, 1)).toBe(0)
  })

  it("orders by rarity, then level", () => {
    const items = [
      { rarity: "Epic", level: 9 },
      { rarity: "Legendary", level: 1 },
      { rarity: "Epic", level: 3 },
    ] as const
    expect(items.toSorted(compareByRarityThenLevel)).toEqual([
      { rarity: "Legendary", level: 1 },
      { rarity: "Epic", level: 9 },
      { rarity: "Epic", level: 3 },
    ])
  })
})
