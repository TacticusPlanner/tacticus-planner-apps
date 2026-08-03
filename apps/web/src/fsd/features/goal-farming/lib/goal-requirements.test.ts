import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"
import { calculateGoalFarmingStages } from "./goal-requirements"
import { createCraftedInventoryPool } from "./upgrade-recipe"

const craftedId = upgradeIdSchema.parse("crafted")
const baseId = upgradeIdSchema.parse("base")
const upgradesById = new Map([
  [
    craftedId,
    {
      id: craftedId,
      label: "Crafted",
      rarity: "Common",
      stat: "health",
      crafted: true,
      recipe: [{ material: baseId, count: 2 }],
      farmLocations: [],
    } as FarmingUpgrade,
  ],
  [
    baseId,
    {
      id: baseId,
      label: "Base",
      rarity: "Common",
      stat: "health",
      crafted: false,
      recipe: [],
      farmLocations: [],
    } as FarmingUpgrade,
  ],
])
const character: FarmingCharacter = {
  id: unitIdSchema.parse("hero"),
  name: "Hero",
  rankUpUpgrades: [
    { rank: "Stone1", upgradeIds: [craftedId] },
    { rank: "Stone2", upgradeIds: [craftedId] },
  ],
}

function params(end: number, amount: number) {
  const detail = {
    goalType: "Rank",
    entityType: "Character",
    config: {
      farmingStrategy: "EveryStep",
      rank: {
        start: 0,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end,
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
    },
  } as GoalDetail

  return {
    detail,
    character,
    characterView: undefined,
    mow: undefined,
    playerCharacter: undefined,
    playerMow: undefined,
    inventoryShard: undefined,
    upgradesById,
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    craftedInventory: createCraftedInventoryPool(
      [{ upgradeId: craftedId, amount }],
      upgradesById
    ),
  }
}

describe("calculateGoalFarmingStages", () => {
  it("returns an applicable empty stage result when crafted inventory covers everything", () => {
    expect(calculateGoalFarmingStages(params(1, 1))).toEqual([])
  })

  it("consumes crafted inventory in stage order", () => {
    expect(calculateGoalFarmingStages(params(2, 1))).toEqual([
      { target: "2", needs: [{ id: baseId, count: 2 }] },
    ])
  })
})
