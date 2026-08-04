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

import type { Battle } from "@/features/goal-farming"
import { computePlanInsights } from ".//plan-insights-calc"

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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    config: {
      rank: null,
      progression: null,
      ability: null,
      farmingStrategy: "TotalUpgrades",
      ascensionFarming: null,
      farmingLocationIds: null,
      upgrade: null,
      item: null,
      level: null,
    },
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: [],
    ...overrides,
  }
}

describe("computePlanInsights", () => {
  const character: Character = {
    id: unitId("hero1"),
    name: "Hero One",
    rankUpUpgrades: [
      { rank: rankOrder[0], upgradeIds: [upgradeId("mat1")] },
      { rank: rankOrder[1], upgradeIds: [upgradeId("mat2")] },
    ],
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
        isMythic: false,
      },
    ],
  }
  const secondUpgrade: UpgradeWithFarmLocations = {
    ...upgrade,
    id: upgradeId("mat2"),
    label: "Material Two",
  }

  const battle: Battle = {
    campaignGroupId: campaignId("campaign1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost: 10,
    dailyAttempts: 999,
  }

  const baseParams = {
    playerCharacterById: new Map(),
    playerMowById: new Map(),
    inventoryShardById: new Map(),
    inventoryUpgrades: [],
    upgradesById: new Map([
      [upgrade.id, upgrade],
      [secondUpgrade.id, secondUpgrade],
    ]),
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
          upgrade: null,
          item: null,
          level: null,
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

  it("uses the shared crafted-inventory pool in goal priority order", () => {
    const craftedId = upgradeId("crafted")
    const baseId = upgradeId("base")
    const craftedCharacter: Character = {
      ...character,
      rankUpUpgrades: [{ rank: rankOrder[0], upgradeIds: [craftedId] }],
    }
    const baseUpgrade: UpgradeWithFarmLocations = {
      ...upgrade,
      id: baseId,
      label: "Base",
    }
    const craftedUpgrade: UpgradeWithFarmLocations = {
      ...upgrade,
      id: craftedId,
      label: "Crafted",
      crafted: true,
      recipe: [{ material: baseId, count: 2 }],
      farmLocations: [],
    }
    const rankConfig = {
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
      farmingStrategy: "TotalUpgrades" as const,
      ascensionFarming: null,
      farmingLocationIds: null,
      upgrade: null,
      item: null,
      level: null,
    }
    const details = [
      goalDetail({ goalId: "first", config: rankConfig }),
      goalDetail({ goalId: "second", config: rankConfig }),
    ]

    const result = computePlanInsights({
      ...baseParams,
      details,
      inventoryUpgrades: [{ upgradeId: craftedId, amount: 1 }],
      upgradesById: new Map([
        [craftedId, craftedUpgrade],
        [baseId, baseUpgrade],
      ]),
      getCharacter: () => craftedCharacter,
      priorityByGoalId: new Map([
        ["first", 1],
        ["second", 2],
      ]),
    })

    expect(result.totals.upgradesByRarity).toEqual({ Common: 2 })
    expect(result.estimates.get("first")).toMatchObject({
      status: "Estimated",
      days: 0,
      energyTotal: 0,
    })
    expect(result.estimates.get("second")).toMatchObject({
      status: "Estimated",
      energyTotal: 20,
    })
  })

  it("estimates a same-rank partial-upgrade target", () => {
    const details = [
      goalDetail({
        config: {
          rank: {
            start: rankIndex(rankOrder[1]),
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(rankOrder[1]),
            endPointFive: false,
            endAppliedUpgrades: 1,
          },
          progression: null,
          ability: null,
          farmingStrategy: "TotalUpgrades",
          ascensionFarming: null,
          farmingLocationIds: null,
          upgrade: null,
          item: null,
          level: null,
        },
      }),
    ]

    const result = computePlanInsights({
      ...baseParams,
      details,
      playerCharacterById: new Map([
        ["hero1", { rank: rankOrder[1], appliedUpgradeSlots: [] } as never],
      ]),
      priorityByGoalId: new Map([["goal-1", 1]]),
    })

    expect(result.estimates.get("goal-1")).toMatchObject({
      energyTotal: 10,
      status: "Estimated",
    })
  })

  it("does not let completed earlier ranks erase a repeated-material estimate", () => {
    const repeatedMaterialCharacter: Character = {
      ...character,
      rankUpUpgrades: [
        {
          rank: rankOrder[0],
          upgradeIds: Array(6).fill(upgrade.id),
        },
        {
          rank: rankOrder[1],
          upgradeIds: Array(6).fill(upgrade.id),
        },
      ],
    }
    const details = [
      goalDetail({
        config: {
          rank: {
            start: rankIndex(rankOrder[0]),
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(rankOrder[2]),
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
          progression: null,
          ability: null,
          farmingStrategy: "TotalUpgrades",
          ascensionFarming: null,
          farmingLocationIds: null,
          upgrade: null,
          item: null,
          level: null,
        },
      }),
    ]

    const result = computePlanInsights({
      ...baseParams,
      details,
      playerCharacterById: new Map([
        [
          "hero1",
          {
            rank: rankOrder[1],
            appliedUpgradeSlots: [0, 1, 2],
          } as never,
        ],
      ]),
      priorityByGoalId: new Map([["goal-1", 1]]),
      getCharacter: (id) =>
        id === repeatedMaterialCharacter.id
          ? repeatedMaterialCharacter
          : undefined,
    })

    expect(result.estimates.get("goal-1")).toMatchObject({
      energyTotal: 30,
      status: "Estimated",
    })
    expect(result.potentialProgressByGoalId.has("goal-1")).toBe(true)
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
          upgrade: null,
          item: null,
          level: null,
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
          upgrade: null,
          item: null,
          level: null,
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

  it("derives Ascension potential from owned alliance orbs", () => {
    const result = computePlanInsights({
      ...baseParams,
      details: [
        goalDetail({
          goalType: "Ascension",
          config: {
            ...goalDetail({}).config,
            progression: {
              start: "Common:None",
              end: "Common:OneStar",
            },
          },
        }),
      ],
      priorityByGoalId: new Map([["goal-1", 1]]),
      playerCharacterById: new Map([
        [
          "hero1",
          {
            unitId: "hero1",
            progressionIndex: "Common:None",
          } as never,
        ],
      ]),
      ascensionCostsById: new Map([
        [
          "Common:OneStar",
          {
            id: "Common:OneStar",
            progression: "Common:OneStar",
            shards: 0,
            mythicShards: 0,
            orbs: 10,
            orbRarity: "Uncommon",
          } as AscensionCostStorageModel,
        ],
      ]),
      inventoryOrbs: {
        imperial: [],
        xenos: [{ rarity: "Uncommon", amount: 5 }],
        chaos: [],
      },
    })

    expect(result.potentialProgressByGoalId.get("goal-1")).toBe(0.5)
  })

  it("restricts an Unlock goal's shard farming to config.farmingLocationIds, changing the resulting energy total", () => {
    const twoLocationCharacterView = {
      ...characterView,
      shardLocations: [
        { battleId: "B1", guaranteed: true },
        { battleId: "B2", guaranteed: true },
      ],
    } as unknown as CharacterStorageModel

    const params = {
      ...baseParams,
      charactersById: new Map([["hero1", twoLocationCharacterView]]),
      battlesById: new Map([
        [battleId("B1"), battle],
        [battleId("B2"), { ...battle, energyCost: 100 } satisfies Battle],
      ]),
      unlockShardCostsById: new Map<string, UnlockShardCostStorageModel>([
        ["Common", { id: "Common", rarity: "Common", shards: 10 }],
      ]),
      priorityByGoalId: new Map([["goal-1", 1]]),
    }

    const restrictedToCheapNode = computePlanInsights({
      ...params,
      details: [
        goalDetail({
          goalType: "Unlock",
          config: {
            ...goalDetail({}).config,
            farmingLocationIds: ["B1"],
          },
        }),
      ],
    })
    const restrictedToExpensiveNode = computePlanInsights({
      ...params,
      details: [
        goalDetail({
          goalType: "Unlock",
          config: {
            ...goalDetail({}).config,
            farmingLocationIds: ["B2"],
          },
        }),
      ],
    })

    // 10 shards at 1 energy/shard (guaranteed drop) from B1 (10 energy) vs. B2 (100 energy).
    expect(restrictedToCheapNode.energyTotal).toBe(100)
    expect(restrictedToExpensiveNode.energyTotal).toBe(1000)
    expect(restrictedToCheapNode.potentialProgressByGoalId.has("goal-1")).toBe(
      false
    )
    expect(
      restrictedToExpensiveNode.potentialProgressByGoalId.has("goal-1")
    ).toBe(false)
  })
})
