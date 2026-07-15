import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
  CampaignDescriptor,
  CharacterStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  rankIndex,
  rankOrder,
  unitIdSchema,
  upgradeIdSchema,
  type UnitId,
} from "@workspace/game-domain"

import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import type { GoalDetail } from "@/entities/goal"

import type { Battle } from "./estimate/estimate.domain"
import { computePlanInsights } from "./plan-insights-calc"

const unitId = unitIdSchema.parse
const upgradeId = upgradeIdSchema.parse
const battleId = battleIdSchema.parse
const campaignId = campaignIdSchema.parse

function goalDetail(overrides: Partial<GoalDetail>): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    aggregateId: null,
    milestonesTotal: 0,
    milestonesCompleted: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    config: {
      rank: null,
      progression: null,
      ability: null,
      shards: null,
      farmingLocationIds: null,
    },
    milestones: [],
    snapshot: null,
    events: [],
    dependsOn: [],
    ...overrides,
  }
}

describe("computePlanInsights", () => {
  const character: Character = {
    id: unitId("hero1"),
    name: "Hero One",
    rankUpUpgrades: [{ rank: rankOrder[0], upgradeIds: [upgradeId("mat1")] }],
  }
  const characterView = {
    id: "hero1",
    name: "Hero One",
    initialRarity: "Common",
    shardLocations: [],
  } as unknown as CharacterStorageModel

  const upgrade: UpgradeWithFarmLocations = {
    id: upgradeId("mat1"),
    label: "Material One",
    rarity: "Common",
    stat: "health",
    crafted: false,
    recipe: [],
    farmLocations: [
      {
        battleId: battleId("B1"),
        guaranteed: true,
        numerator: null,
        denominator: null,
        effectiveRate: null,
      },
    ],
  }

  const battle: Battle = {
    campaignGroupId: campaignId("campaign1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost: 10,
  }

  const baseParams = {
    playerCharacterById: new Map(),
    playerMowById: new Map(),
    inventoryShardById: new Map(),
    inventoryUpgrades: [],
    upgradesById: new Map([[upgrade.id, upgrade]]),
    battlesById: new Map([[battleId("B1"), battle]]),
    charactersById: new Map([["hero1", characterView]]),
    mowsById: new Map<string, MowStorageModel>(),
    ascensionCostsById: new Map<string, AscensionCostStorageModel>(),
    unlockShardCostsById: new Map<string, UnlockShardCostStorageModel>(),
    releaseTypeByGroupId: new Map([[campaignId("campaign1"), "standard"]]),
    getCharacter: (id: UnitId) => (id === character.id ? character : undefined),
    campaignName: (descriptor: Pick<CampaignDescriptor, "nameKey">) =>
      descriptor.nameKey,
    campaignFullLabel: (descriptor: CampaignDescriptor) => descriptor.nameKey,
  }

  it("aggregates a Rank goal's material need by rarity and derives an energy/completion estimate", () => {
    const details = [
      goalDetail({
        goalType: "Rank",
        config: {
          rank: {
            start: rankIndex(rankOrder[0]),
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(rankOrder[1]),
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
          progression: null,
          ability: null,
          shards: null,
          farmingLocationIds: null,
        },
      }),
    ]

    const result = computePlanInsights({
      ...baseParams,
      details,
      priorityByGoalId: new Map([["goal-1", 1]]),
    })

    expect(result.totals.materialsByRarity).toEqual({ Common: 1 })
    expect(result.energyTotal).toBe(10)
    expect(result.completionDate).not.toBeNull()
    expect(result.bottlenecks).toHaveLength(1)
    expect(result.bottlenecks[0]?.label).toBe("Material One")
  })

  it("skips a goal with no priority entry, and returns the empty result for no costable goals", () => {
    const details = [goalDetail({ goalType: "Ability" })]

    const result = computePlanInsights({
      ...baseParams,
      details,
      priorityByGoalId: new Map(),
    })

    expect(result.totals.materialsByRarity).toEqual({})
    expect(result.energyTotal).toBe(0)
    expect(result.completionDate).toBeNull()
    expect(result.bottlenecks).toHaveLength(0)
  })

  it("scores a campaign insight for the material need and records which goal benefits", () => {
    const details = [
      goalDetail({
        goalType: "Rank",
        config: {
          rank: {
            start: rankIndex(rankOrder[0]),
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(rankOrder[1]),
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
          progression: null,
          ability: null,
          shards: null,
          farmingLocationIds: null,
        },
      }),
    ]

    const result = computePlanInsights({
      ...baseParams,
      details,
      priorityByGoalId: new Map([["goal-1", 1]]),
    })

    expect(result.campaignInsights).toHaveLength(1)
    const insight = result.campaignInsights[0]!
    expect(result.benefitingGoalIdsByInsightId.get(insight.id)).toEqual([
      "goal-1",
    ])
  })
})
