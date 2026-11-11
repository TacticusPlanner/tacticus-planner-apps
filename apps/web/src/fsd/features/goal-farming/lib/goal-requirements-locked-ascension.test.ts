import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
} from "@workspace/game-catalog"

import {
  progressionOrder,
  progressionRarity,
  type Progression,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  calculateGoalResourceNeed,
  type GoalRequirementParams,
} from "./goal-requirements"

// Every step costs 10 shards and 1 orb of its own rarity, so the orb map shows which steps were charged.
const ascensionCostsById = new Map<string, AscensionCostStorageModel>(
  progressionOrder.map((progression) => [
    progression,
    {
      id: progression,
      progression,
      shards: 10,
      mythicShards: 0,
      orbs: 1,
      orbRarity: progressionRarity(progression),
    } as AscensionCostStorageModel,
  ])
)

const ascensionGoal = (start: Progression, end: Progression): GoalDetail =>
  ({
    goalId: "ascension",
    goalType: "Ascension",
    entityType: "Character",
    entityId: "lhykhis",
    config: { progression: { start, end } },
  }) as GoalDetail

function params(
  detail: GoalDetail,
  playerCharacter?: GoalRequirementParams["playerCharacter"]
): GoalRequirementParams {
  return {
    detail,
    character: undefined,
    characterView: {
      initialRarity: "Legendary",
    } as CharacterStorageModel,
    mow: undefined,
    playerCharacter,
    playerMow: undefined,
    inventoryShard: undefined,
    upgradesById: new Map(),
    ascensionCostsById,
    unlockShardCostsById: new Map(),
  }
}

describe("calculateGoalResourceNeed — Ascension of a locked character", () => {
  it("charges no orbs below the starting rarity of an unowned Legendary saved from Common", () => {
    const need = calculateGoalResourceNeed(
      params(ascensionGoal("Common:None", "Legendary:RedFiveStars"))
    )

    // Only the two steps above Legendary:RedThreeStars (the unlock point) are charged.
    expect(need?.orbsByType).toEqual({ Legendary: 2 })
    expect(need?.shards).toBe(20)
  })

  it("charges nothing when the target is at or below the starting rarity", () => {
    const need = calculateGoalResourceNeed(
      params(ascensionGoal("Common:None", "Epic:RedThreeStars"))
    )

    expect(need?.orbsByType ?? {}).toEqual({})
  })

  it("still reasons from the synced progression once the character is owned", () => {
    const need = calculateGoalResourceNeed(
      params(ascensionGoal("Epic:RedThreeStars", "Legendary:RedThreeStars"), {
        progressionIndex: "Epic:RedThreeStars",
        shards: 0,
        mythicShards: 0,
      } as GoalRequirementParams["playerCharacter"])
    )

    expect(need?.orbsByType).toEqual({ Legendary: 1 })
  })
})
