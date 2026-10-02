import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  GameCatalogShop,
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
  type BattleId,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"
import type {
  FarmingCharacter,
  FarmingUpgrade,
  FlatSupplier,
} from "@/features/goal-farming/@x/daily-raids"

import {
  selectFarmNodes,
  type EstimateResourceId,
  type EstimateUpgrade,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

import {
  availableCampaignBattles,
  campaignEventProgressKey,
  campaignProgressKey,
  type CampaignEventProgressEntry,
  type CampaignProgressEntry,
} from "./campaign-event-eligibility"
import {
  activeProjectMembers,
  calculateResourceUrgency,
  calculateDailyRaids,
  type DailyRaidsCalculationInput,
} from "./daily-raids-calc"
import { playerUnitIds } from "./use-daily-raids"

function eventBattle(overrides: {
  id: string
  campaignGroupId: string
  type?: string
  challenge?: boolean
  nodeNumber?: number
  battleIndex?: number
}) {
  return {
    type: "Standard",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    ...overrides,
  }
}

function standingProgressMap(
  entries: [
    campaignGroupId: string,
    type: string,
    entry: CampaignProgressEntry,
  ][]
): ReadonlyMap<string, CampaignProgressEntry> {
  return new Map(
    entries.map(([campaignGroupId, type, entry]) => [
      campaignProgressKey(campaignGroupId, type),
      entry,
    ])
  )
}

function progressMap(
  entries: [
    campaignGroupId: string,
    type: string,
    entry: CampaignEventProgressEntry,
  ][]
): ReadonlyMap<string, CampaignEventProgressEntry> {
  return new Map(
    entries.map(([campaignGroupId, type, entry]) => [
      campaignEventProgressKey(campaignGroupId, type),
      entry,
    ])
  )
}

const EVENT_CAMPAIGN_IDS = [
  "eventCampaign1",
  "eventCampaign2",
  "eventCampaign3",
  "eventCampaign4",
  "eventCampaign5",
  "eventCampaign6",
]

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
      acquisitionSources: null,
      farmingLocationIds: null,
      upgrade: null,
    },
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: ["project-1"],
    revision: 1,
    globalPriority: 1,
    ...overrides,
  }
}

function member(status: string, priority: number): ProjectGoalSummary {
  return {
    goal: {
      globalPriority: priority,
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
            battleIndex: 0,
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

  it("resolves a goal's urgency for a resource with no farm locations when a flat supplier covers it (tacticus-planner-apps#103)", () => {
    const shopOnlyId = upgradeIdSchema.parse("shopOnly")
    const flatSuppliers: FlatSupplier[] = [
      { key: "shop:shopOnly", resourceId: shopOnlyId, supplyOnDay: () => 5 },
    ]

    const urgency = calculateResourceUrgency(
      [
        {
          goalId: "shop-goal",
          priority: 1,
          needs: [{ id: shopOnlyId, count: 10 }],
          flatSuppliers,
        },
      ],
      [],
      new Map(),
      new Map(),
      60,
      new Date("2026-01-01T00:00:00.000Z")
    )

    expect(urgency.get("shop-goal:shopOnly")).toEqual({
      days: 2,
      energyTotal: 0,
    })
  })

  it("includes only the active campaign event alongside standing campaigns", () => {
    const battles = [
      eventBattle({ id: "standing", campaignGroupId: "Octarius" }),
      eventBattle({ id: "active", campaignGroupId: "eventCampaign7" }),
      eventBattle({ id: "inactive", campaignGroupId: "eventCampaign6" }),
    ]
    const eventIds = new Set(["eventCampaign6", "eventCampaign7"])
    const progress = progressMap([
      [
        "eventCampaign7",
        "Standard",
        { completedBattleCount: 0, completedChallengeBattlesIds: [] },
      ],
    ])

    expect(
      availableCampaignBattles(
        battles,
        eventIds,
        "eventCampaign7",
        progress
      ).map((battle) => battle.id)
    ).toEqual(["standing", "active"])
    expect(
      availableCampaignBattles(battles, eventIds, null, progress).map(
        (battle) => battle.id
      )
    ).toEqual(["standing"])
  })

  it("excludes an unreached standing campaign battle", () => {
    const battles = [
      eventBattle({
        id: "unreached",
        campaignGroupId: "campaign1",
        battleIndex: 13,
      }),
    ]
    const eventIds = new Set<string>()
    const progress = standingProgressMap([
      ["campaign1", "Standard", { highestCompletedBattleIndex: 10 }],
    ])

    expect(
      availableCampaignBattles(battles, eventIds, null, new Map(), progress)
    ).toEqual([])
  })

  it("keeps a reached standing campaign battle", () => {
    const battles = [
      eventBattle({
        id: "reached",
        campaignGroupId: "campaign1",
        battleIndex: 11,
      }),
    ]
    const eventIds = new Set<string>()
    const progress = standingProgressMap([
      ["campaign1", "Standard", { highestCompletedBattleIndex: 10 }],
    ])

    expect(
      availableCampaignBattles(
        battles,
        eventIds,
        null,
        new Map(),
        progress
      ).map((battle) => battle.id)
    ).toEqual(["reached"])
  })

  it("only admits battleIndex 0 for a standing track with no progress entry", () => {
    const battles = [
      eventBattle({
        id: "first",
        campaignGroupId: "campaign2",
        type: "Elite",
        battleIndex: 0,
      }),
      eventBattle({
        id: "second",
        campaignGroupId: "campaign2",
        type: "Elite",
        battleIndex: 1,
      }),
    ]
    const eventIds = new Set<string>()

    expect(
      availableCampaignBattles(
        battles,
        eventIds,
        null,
        new Map(),
        new Map()
      ).map((battle) => battle.id)
    ).toEqual(["first"])
  })

  it("gates a standing challenge battle by the same battleIndex comparison as a non-challenge one", () => {
    const battles = [
      eventBattle({
        id: "challenge-unreached",
        campaignGroupId: "campaign1",
        challenge: true,
        battleIndex: 13,
      }),
      eventBattle({
        id: "challenge-reached",
        campaignGroupId: "campaign1",
        challenge: true,
        battleIndex: 11,
      }),
    ]
    const eventIds = new Set<string>()
    const progress = standingProgressMap([
      ["campaign1", "Standard", { highestCompletedBattleIndex: 10 }],
    ])

    expect(
      availableCampaignBattles(
        battles,
        eventIds,
        null,
        new Map(),
        progress
      ).map((battle) => battle.id)
    ).toEqual(["challenge-reached"])
  })

  it.each(EVENT_CAMPAIGN_IDS)(
    "excludes an unreached Extremis node for %s even though its event is active",
    (campaignGroupId) => {
      const battles = [
        eventBattle({
          id: "extremis-12",
          campaignGroupId,
          type: "Extremis",
          nodeNumber: 12,
        }),
      ]
      const eventIds = new Set([campaignGroupId])
      const progress = progressMap([
        [
          campaignGroupId,
          "Extremis",
          { completedBattleCount: 0, completedChallengeBattlesIds: [] },
        ],
      ])

      expect(
        availableCampaignBattles(battles, eventIds, campaignGroupId, progress)
      ).toEqual([])
    }
  )

  it.each(EVENT_CAMPAIGN_IDS)(
    "keeps a reached Standard node for %s in the same active event",
    (campaignGroupId) => {
      const battles = [
        eventBattle({
          id: "standard-12",
          campaignGroupId,
          type: "Standard",
          nodeNumber: 12,
        }),
      ]
      const eventIds = new Set([campaignGroupId])
      const progress = progressMap([
        [
          campaignGroupId,
          "Standard",
          { completedBattleCount: 15, completedChallengeBattlesIds: [] },
        ],
      ])

      expect(
        availableCampaignBattles(
          battles,
          eventIds,
          campaignGroupId,
          progress
        ).map((battle) => battle.id)
      ).toEqual(["standard-12"])
    }
  )

  it("excludes an event node with no progress entry at all", () => {
    const battles = [
      eventBattle({
        id: "extremis-12",
        campaignGroupId: "eventCampaign1",
        type: "Extremis",
        nodeNumber: 12,
      }),
    ]
    const eventIds = new Set(["eventCampaign1"])

    expect(
      availableCampaignBattles(battles, eventIds, "eventCampaign1", new Map())
    ).toEqual([])
  })

  it("gates a challenge node by exact battle-id membership, not node number", () => {
    const battles = [
      eventBattle({
        id: "AMSC13B",
        campaignGroupId: "eventCampaign1",
        type: "Standard",
        challenge: true,
        nodeNumber: 13,
      }),
    ]
    const eventIds = new Set(["eventCampaign1"])
    const notCompleted = progressMap([
      [
        "eventCampaign1",
        "Standard",
        { completedBattleCount: 30, completedChallengeBattlesIds: [] },
      ],
    ])
    const completed = progressMap([
      [
        "eventCampaign1",
        "Standard",
        { completedBattleCount: 30, completedChallengeBattlesIds: ["AMSC13B"] },
      ],
    ])

    expect(
      availableCampaignBattles(
        battles,
        eventIds,
        "eventCampaign1",
        notCompleted
      )
    ).toEqual([])
    expect(
      availableCampaignBattles(
        battles,
        eventIds,
        "eventCampaign1",
        completed
      ).map((battle) => battle.id)
    ).toEqual(["AMSC13B"])
  })

  it("a goal-pinned farm location that hasn't been reached yields zero farm candidates, not a substitute location", () => {
    const pinnedBattleId = battleIdSchema.parse("AME12")
    const battles = [
      eventBattle({
        id: pinnedBattleId,
        campaignGroupId: "eventCampaign1",
        type: "Extremis",
        nodeNumber: 12,
      }),
    ]
    const eventIds = new Set(["eventCampaign1"])
    const unreached = progressMap([
      [
        "eventCampaign1",
        "Extremis",
        { completedBattleCount: 0, completedChallengeBattlesIds: [] },
      ],
    ])

    // Mirrors use-daily-raids.ts: battlesById is built from availableCampaignBattles' output, so the
    // unreached pinned node never makes it into the map at all.
    const eligibleBattles = availableCampaignBattles(
      battles,
      eventIds,
      "eventCampaign1",
      unreached
    )
    expect(eligibleBattles).toEqual([])
    const battlesById = new Map<BattleId, Battle>()

    const upgradeId: EstimateResourceId = upgradeIdSchema.parse("upgArmU013")
    const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
      [
        upgradeId,
        {
          id: upgradeId,
          farmLocations: [
            {
              battleId: pinnedBattleId,
              guaranteed: true,
              effectiveRate: null,
              numerator: null,
              denominator: null,
              isMythic: false,
            },
          ],
        },
      ],
    ])

    const candidates = selectFarmNodes(
      { id: upgradeId, count: 1 },
      upgradesById,
      battlesById,
      [pinnedBattleId]
    )

    expect(candidates).toEqual([])
  })

  it("orders interleaved Character and Machine-of-War goals by global priority alone (RAID-004)", () => {
    const entry = (
      goalId: string,
      entityType: string,
      globalPriority: number,
      status = "Active"
    ): ProjectGoalSummary => ({
      goal: {
        ...member("Active", 1).goal,
        goalId,
        entityType,
        globalPriority,
        status,
      },
    })

    const result = activeProjectMembers([
      entry("mow-late", "Mow", 4),
      entry("char-first", "Character", 1),
      entry("mow-paused", "Mow", 2, "Paused"),
      entry("char-third", "Character", 3),
    ])

    // No unit-type weighting: the Character goal ahead of the Machine of War stays ahead, the Paused
    // goal keeps its slot only for display and is left out of the run.
    expect(result.map((item) => item.goal.goalId)).toEqual([
      "char-first",
      "char-third",
      "mow-late",
    ])
  })

  it("keeps only Active members and preserves project priority order", () => {
    const result = activeProjectMembers([
      member("Paused", 0),
      member("Active", 8),
      member("Completed", 1),
      member("Archived", 2),
      member("Active", 3),
    ])

    expect(result.map((entry) => entry.goal.globalPriority)).toEqual([3, 8])
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
      members: [{ goal: { ...detail, globalPriority: 1 } }],
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
            battleIndex: 0,
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

  it("drops an already-owned Unlock goal from the plan instead of farming it (fix-goal-progress-consistency)", () => {
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
      members: [{ goal: { ...detail, globalPriority: 1 } }],
      details: [detail],
      playerCharacterById: new Map([[heroId, { unitId: heroId } as never]]),
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
            battleIndex: 0,
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

    expect(result).toBeNull()
  })

  it("shortens the Raids Plan schedule when a Shop source supplements the campaign farm (tacticus-planner-apps#103)", () => {
    const heroId = unitIdSchema.parse("hero1")
    const nodeId = battleIdSchema.parse("B1")
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
    const battlesById = new Map([
      [
        nodeId,
        {
          campaignGroupId: campaignIdSchema.parse("CG1"),
          type: "Normal",
          challenge: false,
          nodeNumber: 1,
          battleIndex: 0,
          energyCost: 6,
          dailyAttempts: 999,
        },
      ],
    ])
    const ascensionCostsById = new Map<string, AscensionCostStorageModel>([
      [
        "Common:OneStar",
        {
          id: "Common:OneStar",
          progression: "Common:OneStar",
          shards: 20,
          mythicShards: 0,
          orbs: 0,
          orbRarity: null,
        } as AscensionCostStorageModel,
      ],
    ])
    const shops: GameCatalogShop[] = [
      {
        id: "guild",
        displayLocation: "guildMerchant",
        refreshWithAdWatch: true,
        allowedRefreshesPerDay: 1,
        slots: [
          {
            variants: [
              {
                reward: { type: "shards_hero1", qty: 5 },
                days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
                cost: { currency: "guildCredits", amount: 100 },
                maxPurchasesPerDay: 1,
                weight: 1,
                unitId: "hero1",
              },
            ],
          },
        ],
      } as GameCatalogShop,
    ]
    const baseInput = {
      playerCharacterById: new Map(),
      playerMowById: new Map(),
      inventoryShardById: new Map(),
      inventoryUpgrades: [],
      upgradesById: new Map(),
      battlesById,
      charactersById: new Map([[heroId, character]]),
      mowsById: new Map(),
      ascensionCostsById,
      unlockShardCostsById: new Map<string, UnlockShardCostStorageModel>(),
      getCharacter: () => undefined,
      dailyEnergy: 36,
      referenceDate: new Date("2026-01-01T00:00:00.000Z"),
    }

    const detail = goalDetail({
      goalType: "Ascension",
      entityId: heroId,
      config: {
        rank: null,
        progression: { start: "Common:None", end: "Common:OneStar" },
        ability: null,
        farmingStrategy: "TotalUpgrades",
        farmingLocationIds: null,
        upgrade: null,
        acquisitionSources: [{ kind: "Campaign", ids: [nodeId] }],
      },
    })
    const campaignOnly = calculateDailyRaids({
      ...baseInput,
      members: [{ goal: { ...detail, globalPriority: 1 } }],
      details: [detail],
    })

    const detailWithShop = goalDetail({
      goalType: "Ascension",
      entityId: heroId,
      config: {
        rank: null,
        progression: { start: "Common:None", end: "Common:OneStar" },
        ability: null,
        farmingStrategy: "TotalUpgrades",
        farmingLocationIds: null,
        upgrade: null,
        acquisitionSources: [
          { kind: "Campaign", ids: [nodeId] },
          { kind: "Shop", ids: ["guild:shards_hero1"] },
        ],
      },
    })
    const withShop = calculateDailyRaids({
      ...baseInput,
      members: [{ goal: { ...detailWithShop, globalPriority: 1 } }],
      details: [detailWithShop],
      shops,
    })

    expect(campaignOnly?.status).toBe("ready")
    expect(withShop?.status).toBe("ready")
    if (
      !campaignOnly ||
      campaignOnly.status !== "ready" ||
      !withShop ||
      withShop.status !== "ready"
    ) {
      return
    }
    expect(withShop.planSummary.totalDays).toBeLessThan(
      campaignOnly.planSummary.totalDays
    )
    expect(withShop.planSummary.totalEnergy).toBeLessThan(
      campaignOnly.planSummary.totalEnergy
    )
  })

  it("does not invent a shard farm for a MoW unlock without catalog shard data", () => {
    const mowId = unitIdSchema.parse("mow1")
    const detail = goalDetail({ entityType: "Mow", entityId: mowId })

    expect(
      calculateDailyRaids({
        members: [{ goal: { ...detail, globalPriority: 1 } }],
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
    // Three different characters sharing one crafted-inventory pool — the same character can't hold three
    // identical Rank targets (an exact duplicate), and one character's overlapping targets share slots
    // instead (see the rank-milestone tests below).
    const details = ["neurothrope", "ahriman", "abraxas"].map((goalId) =>
      goalDetail({
        goalId,
        entityId: unitIdSchema.parse(`hero-${goalId}`),
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
          acquisitionSources: null,
          farmingLocationIds: null,
          upgrade: null,
        },
      })
    )

    const result = calculateDailyRaids({
      members: details.map((detail, index) => ({
        goal: { ...detail, globalPriority: index + 1 },
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
            battleIndex: 0,
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

  it("charges overlapping Rank milestones for one character once, so Today does not farm the shared slot twice", () => {
    const heroId = unitIdSchema.parse("hero1")
    const baseA = upgradeIdSchema.parse("baseA")
    const baseB = upgradeIdSchema.parse("baseB")
    const nodeId = battleIdSchema.parse("B1")
    const character: FarmingCharacter = {
      id: heroId,
      name: "Synthetic hero",
      rankUpUpgrades: [
        { rank: rankOrder[0], upgradeIds: [baseA] },
        { rank: rankOrder[1], upgradeIds: [baseB] },
      ],
    }
    const base = (id: typeof baseA, label: string) =>
      ({
        id,
        label,
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
      }) as FarmingUpgrade
    const rankGoal = (goalId: string, end: number) =>
      goalDetail({
        goalId,
        entityId: heroId,
        goalType: "Rank",
        config: {
          rank: {
            start: rankIndex(rankOrder[0]),
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(rankOrder[end]!),
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
          progression: null,
          ability: null,
          farmingStrategy: "TotalUpgrades",
          acquisitionSources: null,
          farmingLocationIds: null,
          upgrade: null,
        },
      })
    // near: rank0 -> rank1 needs baseA. far: rank0 -> rank2 needs baseA + baseB, baseA being shared.
    const details = [rankGoal("near", 1), rankGoal("far", 2)]

    const result = calculateDailyRaids({
      members: details.map((detail, index) => ({
        goal: { ...detail, globalPriority: index + 1 },
      })),
      details,
      playerCharacterById: new Map(),
      playerMowById: new Map(),
      inventoryShardById: new Map(),
      inventoryUpgrades: [],
      upgradesById: new Map([
        [baseA, base(baseA, "A")],
        [baseB, base(baseB, "B")],
      ]),
      battlesById: new Map([
        [
          nodeId,
          {
            campaignGroupId: campaignIdSchema.parse("CG1"),
            type: "Normal",
            challenge: false,
            nodeNumber: 1,
            battleIndex: 0,
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
    const farmed = (goalId: string) =>
      result.today.entries
        .filter((entry) => entry.goalId === goalId)
        .reduce((total, entry) => total + entry.itemsFarmed, 0)
    expect(farmed("near")).toBe(1) // baseA
    expect(farmed("far")).toBe(1) // baseB only — baseA is already claimed by the earlier milestone
    expect(result.today).toEqual(result.planDays[0])
  })

  it("keeps a mixed Rank goal's farmable work and reports its blocker with no completion date (PLAN-014)", () => {
    const heroId = unitIdSchema.parse("hero1")
    const farmable = upgradeIdSchema.parse("farmable")
    const noSource = upgradeIdSchema.parse("noSource")
    const nodeId = battleIdSchema.parse("B1")
    const character: FarmingCharacter = {
      id: heroId,
      name: "Synthetic hero",
      rankUpUpgrades: [
        { rank: rankOrder[0], upgradeIds: [farmable, noSource] },
      ],
    }
    const upgrade = (id: typeof farmable, withNode: boolean) =>
      ({
        id,
        label: id,
        rarity: "Common",
        stat: "health",
        crafted: false,
        recipe: [],
        farmLocations: withNode
          ? [
              {
                battleId: nodeId,
                guaranteed: true,
                effectiveRate: null,
                numerator: null,
                denominator: null,
                isMythic: false,
              },
            ]
          : [],
      }) as FarmingUpgrade
    const detail = goalDetail({
      goalId: "mixed",
      entityId: heroId,
      goalType: "Rank",
      config: {
        rank: {
          start: rankIndex(rankOrder[0]),
          startPointFive: false,
          startAppliedUpgrades: 0,
          end: rankIndex(rankOrder[1]!),
          endPointFive: false,
          endAppliedUpgrades: 0,
        },
        progression: null,
        ability: null,
        farmingStrategy: "TotalUpgrades",
        acquisitionSources: null,
        farmingLocationIds: null,
        upgrade: null,
      },
    })

    const result = calculateDailyRaids({
      members: [{ goal: { ...detail, globalPriority: 1 } }],
      details: [detail],
      playerCharacterById: new Map(),
      playerMowById: new Map(),
      inventoryShardById: new Map(),
      inventoryUpgrades: [],
      upgradesById: new Map([
        [farmable, upgrade(farmable, true)],
        [noSource, upgrade(noSource, false)],
      ]),
      battlesById: new Map([
        [
          nodeId,
          {
            campaignGroupId: campaignIdSchema.parse("CG1"),
            type: "Normal",
            challenge: false,
            nodeNumber: 1,
            battleIndex: 0,
            energyCost: 6,
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
    if (!result) return
    expect(result.today.entries.map((entry) => entry.resourceId)).toEqual([
      farmable,
    ])
    expect(result.today).toEqual(result.planDays[0])
    expect(result.blockedGoals).toEqual([
      {
        goalId: "mixed",
        partial: true,
        blockers: [
          { resourceId: noSource, reason: "NoFarmLocation", remaining: 1 },
        ],
      },
    ])
    expect(result.planSummary.completionDate).toBeNull()
  })

  it("returns the HSE farm list only when given the event inputs, picking the point-earning node where Today keeps the efficient one, and leaves Today, Bonus and the Plan untouched", () => {
    const heroId = unitIdSchema.parse("hero1")
    const baseId = upgradeIdSchema.parse("base")
    const nodeA = battleIdSchema.parse("A")
    const nodeB = battleIdSchema.parse("B")
    const location = (battleId: typeof nodeA, expectedGold: number) => ({
      battleId,
      guaranteed: true,
      effectiveRate: null,
      numerator: null,
      denominator: null,
      isMythic: false,
      expectedGold,
    })
    const baseUpgrade = {
      id: baseId,
      label: "Base",
      rarity: "Common",
      stat: "health",
      crafted: false,
      recipe: [],
      farmLocations: [location(nodeA, 1), location(nodeB, 9)],
    } as FarmingUpgrade
    const node = (): Battle => ({
      campaignGroupId: campaignIdSchema.parse("CG1"),
      type: "Normal",
      challenge: false,
      nodeNumber: 1,
      battleIndex: 0,
      energyCost: 10,
      dailyAttempts: 999,
    })
    const detail = goalDetail({
      goalId: "g1",
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
        acquisitionSources: null,
        farmingLocationIds: null,
        upgrade: null,
      },
    })
    const run = (eventFarm?: DailyRaidsCalculationInput["eventFarm"]) =>
      calculateDailyRaids({
        members: [{ goal: { ...detail, globalPriority: 1 } }],
        details: [detail],
        playerCharacterById: new Map(),
        playerMowById: new Map(),
        inventoryShardById: new Map(),
        inventoryUpgrades: [],
        upgradesById: new Map([[baseId, baseUpgrade]]),
        battlesById: new Map([
          [nodeA, node()],
          [nodeB, node()],
        ]),
        charactersById: new Map(),
        mowsById: new Map(),
        ascensionCostsById: new Map(),
        unlockShardCostsById: new Map(),
        getCharacter: () => ({
          id: heroId,
          name: "Synthetic hero",
          rankUpUpgrades: [{ rank: rankOrder[0], upgradeIds: [baseId] }],
        }),
        dailyEnergy: 100,
        referenceDate: new Date("2026-01-01T00:00:00.000Z"),
        eventFarm,
      })

    const plain = run()
    // Only node A earns event points; Today still prefers B (higher expected gold on the tie).
    const withEvent = run({
      pointsByBattleId: new Map([[nodeA, 3]]),
      attemptsLeftByBattle: new Map(),
      energyBudget: 100,
    })
    expect(plain?.status).toBe("ready")
    expect(withEvent?.status).toBe("ready")
    if (plain?.status !== "ready" || withEvent?.status !== "ready") return
    expect(plain.eventFarm).toBeUndefined()
    expect(withEvent.eventFarm?.rows.map((row) => row.battleId)).toEqual([
      nodeA,
    ])
    expect(withEvent.eventFarm?.totalPoints).toBeGreaterThan(0)
    expect(withEvent.today.entries.map((entry) => entry.battleId)).toEqual([
      nodeB,
    ])
    // Nothing else in the result moves: the event inputs are a pure add-on.
    expect({ ...withEvent, eventFarm: undefined }).toEqual(plain)
  })
})

describe("Upgrade goals in the plan", () => {
  const heroId = unitIdSchema.parse("hero1")
  const baseA = upgradeIdSchema.parse("baseA")
  const baseB = upgradeIdSchema.parse("baseB")
  const nodeId = battleIdSchema.parse("B1")
  const farmable = (id: typeof baseA) =>
    ({
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
    }) as FarmingUpgrade
  const upgradeGoal = (
    goalId: string,
    upgradeId: typeof baseA,
    quantity: number,
    priority: number,
    status = "Active"
  ) => {
    const detail = goalDetail({
      goalId,
      entityId: heroId,
      goalType: "Upgrade",
      status: status as GoalDetail["status"],
      config: {
        rank: null,
        progression: null,
        ability: null,
        farmingStrategy: "TotalUpgrades",
        acquisitionSources: null,
        farmingLocationIds: null,
        upgrade: { targets: [{ upgradeId, quantity }] },
      },
    })
    return { ...detail, globalPriority: priority }
  }
  const run = (
    details: GoalDetail[],
    inventoryUpgrades: { upgradeId: typeof baseA; amount: number }[] = [],
    dailyEnergy = 100
  ) => {
    const result = calculateDailyRaids({
      members: details.map((detail) => ({ goal: detail })),
      details,
      playerCharacterById: new Map(),
      playerMowById: new Map(),
      inventoryShardById: new Map(),
      inventoryUpgrades,
      upgradesById: new Map([
        [baseA, farmable(baseA)],
        [baseB, farmable(baseB)],
      ]),
      battlesById: new Map([
        [
          nodeId,
          {
            campaignGroupId: campaignIdSchema.parse("CG1"),
            type: "Normal",
            challenge: false,
            nodeNumber: 1,
            battleIndex: 0,
            energyCost: 10,
            dailyAttempts: 999,
          },
        ],
      ]),
      charactersById: new Map(),
      mowsById: new Map(),
      ascensionCostsById: new Map(),
      unlockShardCostsById: new Map(),
      getCharacter: () => undefined,
      dailyEnergy,
      referenceDate: new Date("2026-01-01T00:00:00.000Z"),
    })
    return result
  }
  const ready = (...args: Parameters<typeof run>) => {
    const result = run(...args)
    if (result?.status !== "ready") throw new Error("not ready")
    return result
  }
  const farmedFor = (
    entries: { goalId: string; itemsFarmed: number }[],
    goalId: string
  ) =>
    entries
      .filter((entry) => entry.goalId === goalId)
      .reduce((total, entry) => total + entry.itemsFarmed, 0)

  it("appears in Today and Plan Day 1", () => {
    const result = ready([upgradeGoal("up", baseA, 5, 1)])
    expect(farmedFor(result.today.entries, "up")).toBe(5)
    expect(result.today).toEqual(result.planDays[0])
  })

  it("carries a non-empty entityId for a Machine of War goal too", () => {
    const goal = {
      ...upgradeGoal("mow-up", baseA, 2, 1),
      entityType: "Mow" as const,
      entityId: "mow1",
    }
    expect(goal.entityId).not.toBe("")
    const result = ready([goal])
    expect(farmedFor(result.today.entries, "mow-up")).toBe(2)
  })

  it("is ordered by priority and spills to later days after higher-priority goals", () => {
    const result = ready(
      [upgradeGoal("low", baseB, 5, 2), upgradeGoal("high", baseA, 5, 1)],
      [],
      50
    )
    expect(farmedFor(result.today.entries, "high")).toBe(5)
    expect(farmedFor(result.today.entries, "low")).toBe(0)
    expect(farmedFor(result.planDays[1]!.entries, "low")).toBe(5)
  })

  it("is absent when inventory covers it", () => {
    const result = run(
      [upgradeGoal("up", baseA, 5, 1)],
      [{ upgradeId: baseA, amount: 5 }]
    )
    // Nothing left to farm, so there is no plan at all.
    expect(result?.status).not.toBe("ready")
  })

  it("is absent when Paused", () => {
    const result = ready([
      upgradeGoal("up", baseA, 5, 1, "Paused"),
      upgradeGoal("other", baseB, 1, 2),
    ])
    expect(farmedFor(result.today.entries, "up")).toBe(0)
    expect(farmedFor(result.today.entries, "other")).toBe(1)
  })

  describe("Mythic material from shops (add-mythic-material-shop-sources)", () => {
    const venerable = upgradeIdSchema.parse("upgHpM004")
    // Venerable Battle Mark as the real Guild shop serves it: guaranteed TUE, 1 of 4 on SAT/SUN.
    const guild = {
      id: "guild",
      displayLocation: "guildMerchant",
      refreshWithAdWatch: true,
      allowedRefreshesPerDay: 1,
      slots: [
        {
          variants: (
            [
              ["upgHpM001", "WED"],
              ["upgHpM004", "TUE"],
            ] as const
          ).map(([id, day]) => ({
            reward: { type: id, qty: 1 },
            days: [day, "SAT", "SUN"],
            cost: { currency: "guildCredits", amount: 900 },
            maxPurchasesPerDay: 2,
            weight: 1,
          })),
        },
      ],
    } as unknown as GameCatalogShop
    const runWithShops = (
      acquisitionSources: GoalDetail["config"]["acquisitionSources"]
    ) => {
      // Plus one raidable material, so Today has work and a plan is produced.
      const base = upgradeGoal("ragnar", venerable, 2, 1)
      const detail = {
        ...base,
        config: {
          ...base.config,
          acquisitionSources,
          upgrade: {
            targets: [
              { upgradeId: venerable, quantity: 2 },
              { upgradeId: baseA, quantity: 1 },
            ],
          },
        },
      }
      return calculateDailyRaids({
        members: [{ goal: detail }],
        details: [detail],
        playerCharacterById: new Map(),
        playerMowById: new Map(),
        inventoryShardById: new Map(),
        inventoryUpgrades: [],
        upgradesById: new Map([
          [
            venerable,
            { ...farmable(venerable), rarity: "Mythic", farmLocations: [] },
          ],
          [baseA, farmable(baseA)],
        ]),
        battlesById: new Map([
          [
            nodeId,
            {
              campaignGroupId: campaignIdSchema.parse("CG1"),
              type: "Normal",
              challenge: false,
              nodeNumber: 1,
              battleIndex: 0,
              energyCost: 10,
              dailyAttempts: 999,
            },
          ],
        ]),
        charactersById: new Map(),
        mowsById: new Map(),
        ascensionCostsById: new Map(),
        unlockShardCostsById: new Map(),
        getCharacter: () => undefined,
        dailyEnergy: 100,
        shops: [guild],
        // 2026-10-05 is a Monday (UTC).
        referenceDate: new Date("2026-10-05T00:00:00.000Z"),
      })
    }

    it("is scheduled from every available offer by default instead of being blocked", () => {
      const result = runWithShops(null)

      if (result?.status !== "ready") throw new Error("not ready")
      expect(result.blockedGoals).toEqual([])
      expect(result.planDays[1]!.shopEntries).toEqual([
        { goalId: "ragnar", offerId: "guild:upgHpM004", expectedAmount: 2 },
      ])
      expect(result.shopOffersById.get("guild:upgHpM004")?.rewardType).toBe(
        "upgHpM004"
      )
      expect(result.planSummary.completionDate).toBe("2026-10-06")
    })

    it("stays blocked when the goal opted out of every offer", () => {
      const result = runWithShops([{ kind: "Shop", ids: [] }])

      if (result?.status !== "ready") throw new Error("not ready")
      expect(result.blockedGoals).toEqual([
        {
          goalId: "ragnar",
          partial: true,
          blockers: [
            { resourceId: venerable, reason: "NoFarmLocation", remaining: 2 },
          ],
        },
      ])
      expect(result.planSummary.completionDate).toBeNull()
    })
  })
})
