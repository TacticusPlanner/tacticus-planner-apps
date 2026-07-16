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
      farmingStrategy: "TotalUpgrades",
      ascensionFarming: null,
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
    alliance: "Xenos",
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
          farmingStrategy: "TotalUpgrades",
          ascensionFarming: null,
          farmingLocationIds: null,
        },
      }),
    ]

    const result = computePlanInsights({
      ...baseParams,
      details,
      priorityByGoalId: new Map([["goal-1", 1]]),
    })

    expect(result.totals.upgradesByRarity).toEqual({ Common: 1 })
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

    expect(result.totals.upgradesByRarity).toEqual({})
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
          farmingStrategy: "TotalUpgrades",
          ascensionFarming: null,
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

  it("uses the entity alliance's saved Onslaught progress for Ascension tokens and duration", () => {
    const details = [
      goalDetail({
        goalType: "Ascension",
        config: {
          rank: null,
          progression: { start: "Common:None", end: "Common:OneStar" },
          ability: null,
          farmingStrategy: "TotalUpgrades",
          farmingLocationIds: null,
          ascensionFarming: {
            source: "Onslaught",
            shardBattleIds: [],
            mythicShardBattleIds: [],
          },
        },
      }),
    ]
    const result = computePlanInsights({
      ...baseParams,
      details,
      priorityByGoalId: new Map([["goal-1", 1]]),
      ascensionCostsById: new Map([
        [
          "Common:OneStar",
          {
            id: "Common:OneStar",
            progression: "Common:OneStar",
            shards: 10,
            mythicShards: 0,
            orbs: 0,
            orbRarity: null,
          } as AscensionCostStorageModel,
        ],
      ]),
      onslaughtProgress: {
        imperial: { sector: "Stone", tier: 1 },
        xenos: { sector: "Diamond", tier: 1 },
        chaos: { sector: "Stone", tier: 1 },
        revision: 2,
      },
      currentOnslaughtTokens: 1,
      onslaughtRewards: [
        {
          id: "Diamond-1",
          sector: "Diamond",
          tier: 1,
          regular: [
            { min: 3, max: 4 },
            { min: 4, max: 5 },
            { min: 6, max: 7 },
            { min: 10, max: 11 },
            { min: 16, max: 20 },
          ],
          mythic: { min: 1, max: 2 },
        },
      ],
    })

    expect(result.onslaughtTokens).toBe(3)
    expect(result.onslaughtDays).toBeCloseTo(2 / 1.5)
  })
})
