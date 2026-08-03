import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
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
import type { CombinedGoalSpec, GoalDetail } from "@/entities/goal"

import type { Battle } from "@/features/goal-farming"
import {
  buildPreviewGoalDetails,
  estimateNewGoalsForProject,
} from ".//per-project-estimate"

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

describe("buildPreviewGoalDetails", () => {
  it("fills a combined spec's partial config out to a full GoalConfig, defaulting unset fields to null", () => {
    const specs: CombinedGoalSpec[] = [
      {
        goalType: "Rank",
        config: {
          rank: {
            start: 0,
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: 1,
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
        },
        dependsOnIndex: [],
      },
    ]

    const [detail] = buildPreviewGoalDetails("Character", "hero1", specs)

    expect(detail).toMatchObject({
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status: "Paused",
    })
    expect(detail?.config.rank).toEqual(specs[0]?.config.rank)
    expect(detail?.config.farmingStrategy).toBe("TotalUpgrades")
    expect(detail?.config.progression).toBeNull()
    expect(detail?.config.ability).toBeNull()
  })

  it("gives each spec in the set a distinct placeholder goal id, in order", () => {
    const specs: CombinedGoalSpec[] = [
      { goalType: "Unlock", config: {}, dependsOnIndex: [] },
      {
        goalType: "Rank",
        config: {
          rank: {
            start: 0,
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: 1,
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
        },
        dependsOnIndex: [0],
      },
    ]

    const details = buildPreviewGoalDetails("Character", "hero1", specs)

    expect(details.map((detail) => detail.goalId)).toEqual([
      details[0]?.goalId,
      details[1]?.goalId,
    ])
    expect(new Set(details.map((detail) => detail.goalId)).size).toBe(2)
  })
})

describe("estimateNewGoalsForProject", () => {
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
        isMythic: false,
      },
    ],
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
    upgradesById: new Map([[upgrade.id, upgrade]]),
    battlesById: new Map([[battleId("B1"), battle]]),
    charactersById: new Map([["hero1", characterView]]),
    mowsById: new Map<string, MowStorageModel>(),
    ascensionCostsById: new Map<string, AscensionCostStorageModel>(),
    unlockShardCostsById: new Map<string, UnlockShardCostStorageModel>(),
    releaseTypeByGroupId: new Map([[campaignId("campaign1"), "standard"]]),
    getCharacter: (id: UnitId) => (id === character.id ? character : undefined),
    dailyEnergy: 288,
  }

  const rankSpecDetail = (goalId: string) =>
    goalDetail({
      goalId,
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
    })

  it("estimates the new goal alone when the project has no existing active goals", () => {
    const outcome = estimateNewGoalsForProject({
      ...baseParams,
      existingDetails: [],
      existingPriorities: new Map(),
      newDetails: [rankSpecDetail("preview-0")],
      newBasePriority: 1,
    })

    expect(outcome).toMatchObject({ status: "Estimated", energyTotal: 10 })
  })

  it("coexists with an existing active goal in the project without id collisions or errors", () => {
    // A same-entity, same-material existing goal at a different (lower) priority than the new one —
    // exercises that existingDetails/existingPriorities and the new goal's own placeholder id are
    // correctly folded into one combined details/priority list for computePlanInsights, distinct
    // from the "alone" case above.
    const outcome = estimateNewGoalsForProject({
      ...baseParams,
      existingDetails: [rankSpecDetail("existing-1")],
      existingPriorities: new Map([["existing-1", 1]]),
      newDetails: [rankSpecDetail("preview-0")],
      newBasePriority: 2,
    })

    expect(outcome).toMatchObject({ status: "Estimated" })
  })

  it("returns null when every new goal is an uncosted type", () => {
    const outcome = estimateNewGoalsForProject({
      ...baseParams,
      existingDetails: [],
      existingPriorities: new Map(),
      newDetails: [goalDetail({ goalId: "preview-0", goalType: "Level" })],
      newBasePriority: 1,
    })

    expect(outcome).toBeNull()
  })

  it("surfaces a Blocked outcome when a new goal's material can't be farmed at all", () => {
    const outcome = estimateNewGoalsForProject({
      ...baseParams,
      upgradesById: new Map(), // the goal's material isn't in the catalog at all
      existingDetails: [],
      existingPriorities: new Map(),
      newDetails: [rankSpecDetail("preview-0")],
      newBasePriority: 1,
    })

    expect(outcome).toMatchObject({ status: "Blocked" })
  })
})
