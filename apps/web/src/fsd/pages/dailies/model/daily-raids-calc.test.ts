import { describe, expect, it } from "vitest"
import type {
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
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"
import type { FarmingCharacter, FarmingUpgrade } from "@/features/goal-farming"

import {
  activeProjectMembers,
  availableCampaignBattles,
  calculateResourceUrgency,
  calculateDailyRaids,
} from "./daily-raids-calc"
import { playerUnitIds } from "./use-daily-raids"

function goalDetail(overrides: Partial<GoalDetail>): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Unlock",
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
      level: null,
    },
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: ["project-1"],
    ...overrides,
  }
}

function member(status: string, priority: number): ProjectGoalSummary {
  return {
    priority,
    goal: {
      goalId: `${status}-${priority}`,
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status,
      notes: null,
      dependsOn: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  }
}

describe("daily raid derivation", () => {
  it("derives per-resource urgency after priority-shared inventory allocation", () => {
    const fastId = upgradeIdSchema.parse("fast")
    const slowId = upgradeIdSchema.parse("slow")
    const nodeId = battleIdSchema.parse("B1")
    const upgrade = (id: typeof fastId): FarmingUpgrade => ({
      id,
      label: id,
      rarity: "Common",
      stat: "health",
      crafted: false,
      recipe: [],
      farmLocations: [
        {
          battleId: nodeId,
          guaranteed: true,
          effectiveRate: null,
          numerator: null,
          denominator: null,
          isMythic: false,
        },
      ],
    })

    const urgency = calculateResourceUrgency(
      [
        {
          goalId: "higher-priority",
          priority: 1,
          needs: [
            { id: fastId, count: 1 },
            { id: slowId, count: 2 },
          ],
        },
        {
          goalId: "lower-priority",
          priority: 2,
          needs: [{ id: fastId, count: 1 }],
        },
      ],
      [{ id: fastId, count: 1 }],
      new Map([
        [fastId, upgrade(fastId)],
        [slowId, upgrade(slowId)],
      ]),
      new Map([
        [
          nodeId,
          {
            campaignGroupId: campaignIdSchema.parse("CG1"),
            type: "Normal",
            challenge: false,
            nodeNumber: 1,
            energyCost: 6,
            dailyAttempts: 1,
          },
        ],
      ]),
      60,
      new Date("2026-01-01T00:00:00.000Z")
    )

    expect(urgency.has("higher-priority:fast")).toBe(false)
    expect(urgency.get("higher-priority:slow")).toEqual({
      days: 2,
      energyTotal: 12,
    })
    expect(urgency.get("lower-priority:fast")).toEqual({
      days: 1,
      energyTotal: 6,
    })
  })

  it("includes only the active campaign event alongside standing campaigns", () => {
    const battles = [
      { id: "standing", campaignGroupId: "Octarius" },
      { id: "active", campaignGroupId: "eventCampaign7" },
      { id: "inactive", campaignGroupId: "eventCampaign6" },
    ]
    const eventIds = new Set(["eventCampaign6", "eventCampaign7"])

    expect(
      availableCampaignBattles(battles, eventIds, "eventCampaign7").map(
        (battle) => battle.id
      )
    ).toEqual(["standing", "active"])
    expect(
      availableCampaignBattles(battles, eventIds, null).map(
        (battle) => battle.id
      )
    ).toEqual(["standing"])
  })

  it("keeps only Active members and preserves project priority order", () => {
    const result = activeProjectMembers([
      member("Paused", 0),
      member("Active", 8),
      member("Completed", 1),
      member("Archived", 2),
      member("Active", 3),
    ])

    expect(result.map((entry) => entry.priority)).toEqual([3, 8])
    expect(result.every((entry) => entry.goal.status === "Active")).toBe(true)
  })

  it("returns no farmable plan when the selected project has no Active goals", () => {
    expect(
      calculateDailyRaids({
        members: [member("Paused", 1), member("Completed", 2)],
        details: [],
        playerCharacterById: new Map(),
        playerMowById: new Map(),
        inventoryShardById: new Map(),
        inventoryUpgrades: [],
        upgradesById: new Map(),
        battlesById: new Map(),
        charactersById: new Map(),
        mowsById: new Map(),
        ascensionCostsById: new Map(),
        unlockShardCostsById: new Map(),
        getCharacter: () => undefined,
        dailyEnergy: 288,
      })
    ).toBeNull()
  })

  it("derives shard visuals, labels, and progress for a Character unlock", () => {
    const heroId = unitIdSchema.parse("hero1")
    const nodeId = battleIdSchema.parse("B1")
    const detail = goalDetail({ entityId: heroId })
    const character = {
      id: heroId,
      name: "Hero One",
      initialRarity: "Common",
      shardLocations: [
        {
          battleId: nodeId,
          guaranteed: true,
          effectiveRate: null,
          numerator: null,
          denominator: null,
          isMythic: false,
        },
      ],
    } as unknown as CharacterStorageModel
    const unlockCosts = new Map<string, UnlockShardCostStorageModel>([
      ["Common", { id: "Common", rarity: "Common", shards: 40 }],
    ])

    const result = calculateDailyRaids({
      members: [{ priority: 1, goal: detail }],
      details: [detail],
      playerCharacterById: new Map(),
      playerMowById: new Map(),
      inventoryShardById: new Map([
        [heroId, { unitId: heroId, amount: 5 } as never],
      ]),
      inventoryUpgrades: [],
      upgradesById: new Map(),
      battlesById: new Map([
        [
          nodeId,
          {
            campaignGroupId: campaignIdSchema.parse("CG1"),
            type: "Normal",
            challenge: false,
            nodeNumber: 1,
            energyCost: 6,
            dailyAttempts: 10,
          },
        ],
      ]),
      charactersById: new Map([[heroId, character]]),
      mowsById: new Map(),
      ascensionCostsById: new Map(),
      unlockShardCostsById: unlockCosts,
      getCharacter: () => undefined,
      dailyEnergy: 60,
      referenceDate: new Date("2026-01-01T00:00:00.000Z"),
    })

    expect(result?.status).toBe("ready")
    if (!result || result.status !== "ready") return
    expect(result.today.entries[0]?.resourceId).toBe("shard:hero1")
    expect(result.resourceLabels.get("shard:hero1")).toBe("Hero One shards")
    expect(result.resourceVisuals.get("shard:hero1")).toEqual({
      kind: "shard",
      unitId: heroId,
    })
    expect(
      result.resourceProgressByDay.get(1)?.get("goal-1:shard:hero1")
    ).toEqual({ owned: 5, target: 40 })
  })

  it("does not invent a shard farm for a MoW unlock without catalog shard data", () => {
    const mowId = unitIdSchema.parse("mow1")
    const detail = goalDetail({ entityType: "Mow", entityId: mowId })

    expect(
      calculateDailyRaids({
        members: [{ priority: 1, goal: detail }],
        details: [detail],
        playerCharacterById: new Map(),
        playerMowById: new Map(),
        inventoryShardById: new Map(),
        inventoryUpgrades: [],
        upgradesById: new Map(),
        battlesById: new Map(),
        charactersById: new Map(),
        mowsById: new Map([
          [mowId, { id: mowId, name: "Machine" } as MowStorageModel],
        ]),
        ascensionCostsById: new Map(),
        unlockShardCostsById: new Map(),
        getCharacter: () => undefined,
        dailyEnergy: 60,
      })
    ).toBeNull()
  })

  it("partitions player-data lookups by unit entity type", () => {
    expect(
      playerUnitIds([
        { entityType: "Character", entityId: "hero1" },
        { entityType: "Character", entityId: "hero1" },
        { entityType: "Mow", entityId: "mow1" },
      ])
    ).toEqual({
      characterIds: [unitIdSchema.parse("hero1")],
      mowIds: [unitIdSchema.parse("mow1")],
    })
  })

  it("shares crafted inventory by priority and keeps Today identical to Plan Day 1", () => {
    const heroId = unitIdSchema.parse("hero1")
    const craftedId = upgradeIdSchema.parse("crafted")
    const baseId = upgradeIdSchema.parse("base")
    const nodeId = battleIdSchema.parse("B1")
    const character: FarmingCharacter = {
      id: heroId,
      name: "Synthetic hero",
      rankUpUpgrades: [{ rank: rankOrder[0], upgradeIds: [craftedId] }],
    }
    const baseUpgrade = {
      id: baseId,
      label: "Base",
      rarity: "Common",
      stat: "health",
      crafted: false,
      recipe: [],
      farmLocations: [
        {
          battleId: nodeId,
          guaranteed: true,
          effectiveRate: null,
          numerator: null,
          denominator: null,
          isMythic: false,
        },
      ],
    } as FarmingUpgrade
    const craftedUpgrade = {
      ...baseUpgrade,
      id: craftedId,
      label: "Crafted",
      crafted: true,
      recipe: [{ material: baseId, count: 2 }],
      farmLocations: [],
    } as FarmingUpgrade
    const details = ["neurothrope", "ahriman", "abraxas"].map((goalId) =>
      goalDetail({
        goalId,
        entityId: heroId,
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
          level: null,
        },
      })
    )

    const result = calculateDailyRaids({
      members: details.map((detail, index) => ({
        priority: index + 1,
        goal: detail,
      })),
      details,
      playerCharacterById: new Map(),
      playerMowById: new Map(),
      inventoryShardById: new Map(),
      inventoryUpgrades: [{ upgradeId: craftedId, amount: 1 }],
      upgradesById: new Map([
        [craftedId, craftedUpgrade],
        [baseId, baseUpgrade],
      ]),
      battlesById: new Map([
        [
          nodeId,
          {
            campaignGroupId: campaignIdSchema.parse("CG1"),
            type: "Normal",
            challenge: false,
            nodeNumber: 1,
            energyCost: 10,
            dailyAttempts: 999,
          },
        ],
      ]),
      charactersById: new Map(),
      mowsById: new Map(),
      ascensionCostsById: new Map(),
      unlockShardCostsById: new Map(),
      getCharacter: () => character,
      dailyEnergy: 100,
      referenceDate: new Date("2026-01-01T00:00:00.000Z"),
    })

    expect(result?.status).toBe("ready")
    if (!result || result.status !== "ready") return
    expect(result.today).toEqual(result.planDays[0])
    expect(result.today.entries).toEqual([
      expect.objectContaining({ goalId: "ahriman", itemsFarmed: 2 }),
      expect.objectContaining({ goalId: "abraxas", itemsFarmed: 2 }),
    ])
    expect(
      result.today.entries.some((entry) => entry.goalId === "neurothrope")
    ).toBe(false)
  })
})
