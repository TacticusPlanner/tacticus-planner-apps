import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

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

describe("calculateGoalFarmingStages — MoW ability", () => {
  const pA = upgradeIdSchema.parse("pA")
  const pB = upgradeIdSchema.parse("pB")
  const sA = upgradeIdSchema.parse("sA")
  const sB = upgradeIdSchema.parse("sB")
  const abilityUpgrades = new Map(
    [pA, pB, sA, sB].map((id) => [
      id,
      {
        id,
        label: id,
        rarity: "Common",
        stat: "health",
        crafted: false,
        recipe: [],
        farmLocations: [],
      } as FarmingUpgrade,
    ])
  )
  const mow = {
    // recipes[i] holds the materials for reaching ability level i + 2.
    primaryAbility: { recipes: [[pA], [pB]] },
    secondaryAbility: { recipes: [[sA], [sB]] },
  } as unknown as MowStorageModel

  function abilityParams(
    activeEnd: number,
    passiveEnd: number
  ): Parameters<typeof calculateGoalFarmingStages>[0] {
    return {
      detail: {
        goalType: "Ability",
        entityType: "Mow",
        config: {
          farmingStrategy: "TotalUpgrades",
          ability: {
            activeStart: 1,
            activeEnd,
            passiveStart: 1,
            passiveEnd,
          },
        },
      } as GoalDetail,
      character: undefined,
      characterView: undefined,
      mow,
      playerCharacter: undefined,
      playerMow: undefined,
      inventoryShard: undefined,
      upgradesById: abilityUpgrades,
      ascensionCostsById: new Map(),
      unlockShardCostsById: new Map(),
    }
  }

  it("emits stages for both ability tracks when both advance", () => {
    const stages = calculateGoalFarmingStages(abilityParams(3, 3))
    expect(stages).not.toBeNull()
    const needs = stages!.flatMap((stage) => stage.needs)
    expect(needs).toEqual(
      expect.arrayContaining([
        { id: pA, count: 1 },
        { id: pB, count: 1 },
        { id: sA, count: 1 },
        { id: sB, count: 1 },
      ])
    )
    // One base upgrade per level transition on each track — no shared transition double-counted.
    expect(needs).toHaveLength(4)
  })

  it("emits stages for only the advancing track when the other is static", () => {
    const stages = calculateGoalFarmingStages(abilityParams(3, 1))
    expect(stages).not.toBeNull()
    const needs = stages!.flatMap((stage) => stage.needs)
    expect(needs).toEqual(
      expect.arrayContaining([
        { id: pA, count: 1 },
        { id: pB, count: 1 },
      ])
    )
    expect(needs).toHaveLength(2)
  })
})
