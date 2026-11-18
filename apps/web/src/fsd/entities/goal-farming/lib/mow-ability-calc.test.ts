import { describe, expect, it } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

import type { MowStorageModel } from "@workspace/game-catalog"

import {
  computeMowMissingUpgrades,
  mowAbilityTrackLevel,
  mowAbilityUpgradeIds,
} from "./mow-ability-calc"

const upgradeId = upgradeIdSchema.parse

// recipes[0] = materials for level 2, recipes[1] = level 3, recipes[2] = level 4 (index + 2).
const recipes = [
  [upgradeId("m2a"), upgradeId("m2b")],
  [upgradeId("m3a")],
  [upgradeId("m4a"), upgradeId("m4b")],
]

describe("mowAbilityUpgradeIds", () => {
  it("flattens the recipe rungs between levelStart and levelEnd", () => {
    // 1 -> 3: consumes the rungs for reaching level 2 and level 3.
    expect(mowAbilityUpgradeIds(recipes, 1, 3)).toEqual([
      upgradeId("m2a"),
      upgradeId("m2b"),
      upgradeId("m3a"),
    ])
  })

  it("returns a single rung for a one-level step", () => {
    expect(mowAbilityUpgradeIds(recipes, 3, 4)).toEqual([
      upgradeId("m4a"),
      upgradeId("m4b"),
    ])
  })

  it("returns [] for an empty or inverted range", () => {
    expect(mowAbilityUpgradeIds(recipes, 2, 2)).toEqual([])
    expect(mowAbilityUpgradeIds(recipes, 4, 1)).toEqual([])
  })

  it("returns [] when the range starts at the free base level with no target beyond it", () => {
    expect(mowAbilityUpgradeIds(recipes, 1, 1)).toEqual([])
  })
})

describe("mowAbilityTrackLevel", () => {
  const playerMow = {
    abilities: [
      { abilityId: "raw-ability-a", level: 5 },
      { abilityId: "raw-ability-b", level: 3 },
    ],
  } as Parameters<typeof mowAbilityTrackLevel>[0]

  it("reads primary from abilities[0] and secondary from abilities[1]", () => {
    expect(mowAbilityTrackLevel(playerMow, "primary")).toBe(5)
    expect(mowAbilityTrackLevel(playerMow, "secondary")).toBe(3)
  })

  it("defaults to level 1 when the entry is missing", () => {
    const partial = {
      abilities: [{ abilityId: "raw-ability-a", level: 5 }],
    } as Parameters<typeof mowAbilityTrackLevel>[0]
    expect(mowAbilityTrackLevel(partial, "secondary")).toBe(1)
  })

  it("defaults to level 1 for an unowned (undefined) MoW", () => {
    expect(mowAbilityTrackLevel(undefined, "primary")).toBe(1)
  })
})

const atLevel = (level: number) =>
  ({
    abilities: [{ abilityId: "raw-ability-a", level }],
  }) as Parameters<typeof mowAbilityTrackLevel>[0]

describe("computeMowMissingUpgrades", () => {
  // Every rung needs the same base material, so levels already applied below the start would cover
  // the range if they were counted.
  const sameMaterial = [[upgradeId("m")], [upgradeId("m")], [upgradeId("m")]]
  const mow = {
    primaryAbility: { recipes: sameMaterial },
    secondaryAbility: { recipes: [] },
  } as unknown as MowStorageModel
  const missing = (start: number, current: number) =>
    computeMowMissingUpgrades({
      abilityEnabled: true,
      mow,
      playerMow: atLevel(current),
      activeStart: start,
      activeEnd: 4,
      passiveStart: 1,
      passiveEnd: 1,
      inventoryUpgrades: [],
      upgradesById: new Map(),
      includeCovered: true,
    })

  it("does not count levels applied below the goal's start as stock", () => {
    expect(missing(3, 3)).toEqual([
      {
        id: "m",
        label: "m",
        missing: 1,
        required: 1,
        inventoryContribution: 0,
      },
    ])
  })

  it("counts levels applied inside the goal's range", () => {
    expect(missing(2, 3)).toEqual([
      {
        id: "m",
        label: "m",
        missing: 1,
        required: 2,
        inventoryContribution: 1,
      },
    ])
  })
})
