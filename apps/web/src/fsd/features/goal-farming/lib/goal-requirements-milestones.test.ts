import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
  CharacterAbilityCostStorageModel,
} from "@workspace/game-catalog"

import type { Progression } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  calculateGoalResourceNeed,
  createUnitCoverage,
  type GoalRequirementParams,
} from "./goal-requirements"

// Several goals of one type for one unit (support-multiple-goals-per-unit): each shared step or
// transition is charged once, to the first goal in priority order that reaches it.

const ascensionCostsById = new Map<string, AscensionCostStorageModel>(
  [
    ["Legendary:RedThreeStars", 100, 10],
    ["Legendary:RedFourStars", 150, 10],
    ["Legendary:RedFiveStars", 250, 15],
    ["Legendary:OneBlueStar", 500, 20],
  ].map(([progression, shards, orbs]) => [
    progression as string,
    {
      id: progression as string,
      progression: progression as Progression,
      shards: shards as number,
      mythicShards: 0,
      orbs: orbs as number,
      orbRarity: "Legendary",
    },
  ])
)

const characterAbilityCostsByLevel = new Map<
  number,
  CharacterAbilityCostStorageModel
>(
  Array.from({ length: 10 }, (_, index) => {
    const level = 41 + index
    return [
      level,
      {
        level,
        gold: 1000,
        badges: { rarity: "Legendary", amount: 2 },
      } as CharacterAbilityCostStorageModel,
    ]
  })
)

function params(
  detail: Partial<GoalDetail>,
  coverage: ReturnType<typeof createUnitCoverage>
): GoalRequirementParams {
  return {
    detail: {
      entityType: "Character",
      entityId: "ragnar",
      ...detail,
    } as GoalDetail,
    character: undefined,
    characterView: undefined,
    mow: undefined,
    playerCharacter: {
      progressionIndex: "Epic:RedThreeStars",
      shards: 40,
      mythicShards: 0,
      abilities: [{ level: 40 }, { level: 40 }],
    } as GoalRequirementParams["playerCharacter"],
    playerMow: undefined,
    inventoryShard: undefined,
    upgradesById: new Map(),
    ascensionCostsById,
    unlockShardCostsById: new Map(),
    characterAbilityCostsByLevel,
    coveredAbilityTransitions: coverage,
    coveredRankSlots: coverage.rankSlots,
    ascensionCoverage: coverage,
  }
}

const ascension = (end: string): Partial<GoalDetail> => ({
  goalId: `ascension-${end}`,
  goalType: "Ascension",
  config: {
    progression: { start: "Epic:RedThreeStars", end },
  } as GoalDetail["config"],
})

const ability = (end: number): Partial<GoalDetail> => ({
  goalId: `ability-${end}`,
  goalType: "Ability",
  config: {
    ability: {
      activeStart: 40,
      activeEnd: end,
      passiveStart: 40,
      passiveEnd: end,
    },
  } as GoalDetail["config"],
})

describe("calculateGoalResourceNeed across milestones of one unit", () => {
  it("draws the unit's owned shards once and allocates Ascension steps once", () => {
    const coverage = createUnitCoverage()

    const first = calculateGoalResourceNeed(
      params(ascension("Legendary:RedFourStars"), coverage)
    )
    const second = calculateGoalResourceNeed(
      params(ascension("Legendary:OneBlueStar"), coverage)
    )

    expect(first?.shards).toBe(210)
    expect(second?.shards).toBe(750)
    expect(second?.orbsByType).toEqual({ Legendary: 35 })
  })

  it("charges two Character Ability milestones the transitions of one 40/40 -> 50/50 goal", () => {
    const coverage = createUnitCoverage()

    const first = calculateGoalResourceNeed(params(ability(45), coverage))
    const second = calculateGoalResourceNeed(params(ability(50), coverage))
    const whole = calculateGoalResourceNeed(
      params(ability(50), createUnitCoverage())
    )

    expect(first?.abilityMaterials?.gold).toBe(10_000)
    expect(second?.abilityMaterials?.gold).toBe(10_000)
    expect(
      (first?.abilityMaterials?.gold ?? 0) +
        (second?.abilityMaterials?.gold ?? 0)
    ).toBe(whole?.abilityMaterials?.gold)
  })
})
