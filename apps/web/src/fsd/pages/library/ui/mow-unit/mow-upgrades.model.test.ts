import { describe, expect, it } from "vitest"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import {
  calculateMowUpgrades,
  defaultMowRange,
  ownedMowStock,
  withFrom,
  type MowCostRung,
} from "./mow-upgrades.model"

// Galatian's first two recipes per ability and its recipes for levels 49 → 51, from the catalog.
const filler = ["x", "x", "x"] as UpgradeId[]
function recipes(entries: Record<number, string[]>): UpgradeId[][] {
  return Array.from(
    { length: 60 },
    (_, index) => (entries[index] as UpgradeId[] | undefined) ?? filler
  )
}
const galatian = {
  primary: recipes({
    0: ["upgHpC002", "upgDmgC001", "upgArmC001"],
    1: ["upgHpC014", "upgDmgC012", "upgArmC013"],
    48: ["upgDmgL001", "upgHpL100", "upgDmgL012C"],
    49: ["upgArmL001", "upgHpL100", "upgArmL004C"],
  }),
  secondary: recipes({ 0: ["upgHpC002", "upgDmgC013", "upgArmC001"] }),
}

// The shared ladder's rungs for levels 2, 3, 50 and 51, from the catalog.
const costsByLevel = new Map<number, MowCostRung>(
  (
    [
      [2, 15, 5, ["Common", 1], null, 1],
      [3, 30, 5, ["Common", 1], null, 1],
      [50, 75000, 0, ["Legendary", 10], ["Legendary", 10], 50],
      [51, 80000, 0, ["Mythic", 1], ["Mythic", 1], 50],
    ] as const
  ).map(([level, gold, salvage, badges, forge, components]) => [
    level,
    {
      level,
      gold,
      salvage,
      badges: { rarity: badges[0], amount: badges[1] },
      forgeBadges: forge ? { rarity: forge[0], amount: forge[1] } : null,
      components,
    },
  ])
)

function upgrade(
  id: string,
  rarity: Rarity,
  recipe: { material: string; count: number }[] = []
): [UpgradeId, UpgradeWithFarmLocations] {
  return [
    id as UpgradeId,
    {
      id: id as UpgradeId,
      label: id,
      rarity,
      stat: "Health",
      crafted: recipe.length > 0,
      recipe: recipe.map((entry) => ({
        material: entry.material as UpgradeId,
        count: entry.count,
      })),
      farmLocations: [],
    },
  ]
}
const upgradesById = new Map([
  ...[
    "upgHpC002",
    "upgDmgC001",
    "upgArmC001",
    "upgHpC014",
    "upgDmgC012",
    "upgArmC013",
    "upgDmgC013",
  ].map((id) => upgrade(id, "Common")),
  upgrade("upgHpU001", "Uncommon"),
  upgrade("upgHpU001C", "Uncommon", [
    { material: "upgHpU001", count: 2 },
    { material: "upgHpC002", count: 1 },
  ]),
])

const lowRanges = {
  primary: { from: 1, to: 3 },
  secondary: { from: 1, to: 2 },
}

describe("calculateMowUpgrades", () => {
  it("costs each step at the rung for the level reached, with that step's recipe", () => {
    const result = calculateMowUpgrades({
      recipes: galatian,
      costsByLevel,
      upgradesById,
      ranges: lowRanges,
    })

    expect(
      result.steps.map((step) => [step.ability, step.from, step.to, step.gold])
    ).toEqual([
      ["primary", 1, 2, 15],
      ["primary", 2, 3, 30],
      ["secondary", 1, 2, 15],
    ])
    expect(result.steps[1]!.recipe).toEqual([
      "upgHpC014",
      "upgDmgC012",
      "upgArmC013",
    ])
    expect(result.needed).toEqual({
      gold: 60,
      salvage: 15,
      components: 3,
      badges: { Common: 3 },
      forgeBadges: {},
    })
    expect(result.remaining).toEqual(result.needed)
    expect(
      Object.fromEntries(result.materials.map((line) => [line.id, line.needed]))
    ).toEqual({
      upgHpC002: 2,
      upgArmC001: 2,
      upgDmgC001: 1,
      upgHpC014: 1,
      upgDmgC012: 1,
      upgArmC013: 1,
      upgDmgC013: 1,
    })
    expect(result.materials.slice(0, 2).map((line) => line.needed)).toEqual([
      2, 2,
    ])
  })

  it("splits badges and forge badges by rarity across a range", () => {
    const result = calculateMowUpgrades({
      recipes: galatian,
      costsByLevel,
      upgradesById,
      ranges: {
        primary: { from: 49, to: 51 },
        secondary: { from: 49, to: 49 },
      },
    })

    expect(result.steps).toHaveLength(2)
    expect(result.needed).toEqual({
      gold: 155000,
      salvage: 0,
      components: 100,
      badges: { Legendary: 10, Mythic: 1 },
      forgeBadges: { Legendary: 10, Mythic: 1 },
    })
  })

  it("adds nothing for an ability whose From equals To", () => {
    const result = calculateMowUpgrades({
      recipes: galatian,
      costsByLevel,
      upgradesById,
      ranges: {
        primary: { from: 5, to: 5 },
        secondary: { from: 5, to: 5 },
      },
    })

    expect(result.steps).toEqual([])
    expect(result.needed.gold).toBe(0)
    expect(result.materials).toEqual([])
  })

  it("breaks crafted materials down and lists the highest rarity first", () => {
    const result = calculateMowUpgrades({
      recipes: {
        primary: recipes({ 0: ["upgHpU001C", "upgHpC002", "upgDmgC001"] }),
        secondary: galatian.secondary,
      },
      costsByLevel,
      upgradesById,
      ranges: { primary: { from: 1, to: 2 }, secondary: { from: 1, to: 1 } },
    })

    expect(
      result.materials.map((line) => [line.id, line.rarity, line.needed])
    ).toEqual([
      ["upgHpU001", "Uncommon", 2],
      ["upgHpC002", "Common", 2],
      ["upgDmgC001", "Common", 1],
    ])
  })

  it("subtracts owned badges, components and materials, but never gold or salvage", () => {
    const result = calculateMowUpgrades({
      recipes: galatian,
      costsByLevel,
      upgradesById,
      ranges: lowRanges,
      owned: {
        badges: { Common: 2 },
        forgeBadges: {},
        components: 5,
        upgrades: [{ id: "upgHpC002" as UpgradeId, amount: 1 }],
      },
    })

    expect(result.remaining).toEqual({
      gold: 60,
      salvage: 15,
      components: 0,
      badges: { Common: 1 },
      forgeBadges: {},
    })
    expect(
      result.materials.find((line) => line.id === "upgHpC002")
    ).toMatchObject({ needed: 2, owned: 1, remaining: 1 })
    expect(
      result.materials.find((line) => line.id === "upgDmgC001")
    ).toMatchObject({ needed: 1, owned: 0, remaining: 1 })
  })

  it("counts crafted stock in the inventory towards its base materials", () => {
    const result = calculateMowUpgrades({
      recipes: galatian,
      costsByLevel,
      upgradesById,
      ranges: lowRanges,
      owned: {
        badges: {},
        forgeBadges: {},
        components: 0,
        upgrades: [{ id: "upgHpU001C" as UpgradeId, amount: 5 }],
      },
    })

    expect(
      result.materials.find((line) => line.id === "upgHpC002")
    ).toMatchObject({ needed: 2, owned: 2, remaining: 0 })
  })
})

describe("ranges", () => {
  it("defaults To to From + 10, capped at the top level", () => {
    expect(defaultMowRange(30, 60)).toEqual({ from: 30, to: 40 })
    expect(defaultMowRange(55, 60)).toEqual({ from: 55, to: 60 })
    expect(defaultMowRange(1, 60)).toEqual({ from: 1, to: 11 })
  })

  it("raises To to From when From passes it", () => {
    expect(withFrom({ from: 10, to: 20 }, 30)).toEqual({ from: 30, to: 30 })
    expect(withFrom({ from: 10, to: 20 }, 15)).toEqual({ from: 15, to: 20 })
  })
})

describe("ownedMowStock", () => {
  it("takes badges and components of the MoW's alliance and every forge badge", () => {
    const inventory = {
      abilityBadges: {
        imperial: [
          { rarity: "Common", amount: 2 },
          { rarity: "Epic", amount: 4 },
        ],
        xenos: [{ rarity: "Common", amount: 9 }],
        chaos: [],
      },
      forgeBadges: [{ rarity: "Legendary", amount: 3 }],
      components: {
        imperial: { amount: 5 },
        xenos: { amount: 7 },
        chaos: { amount: 0 },
      },
    } as unknown as PlayerDataChunkDto<"inventory">

    expect(
      ownedMowStock(
        inventory,
        [{ upgradeId: "upgHpC002" as UpgradeId, amount: 1 }],
        "Imperial"
      )
    ).toEqual({
      badges: { Common: 2, Epic: 4 },
      forgeBadges: { Legendary: 3 },
      components: 5,
      upgrades: [{ id: "upgHpC002", amount: 1 }],
    })
    expect(ownedMowStock(inventory, [], "Xenos")).toMatchObject({
      badges: { Common: 9 },
      components: 7,
    })
  })
})
