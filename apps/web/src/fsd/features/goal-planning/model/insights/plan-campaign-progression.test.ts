import { describe, expect, it } from "vitest"
import type { BattleId, CampaignId } from "@workspace/game-domain"

import type {
  EstimateOutcome,
  EstimateResourceId,
  GoalNeed,
} from "@/features/goal-farming/@x/goal-planning"
import type { Battle, FarmLocation } from "@/shared/lib"

import {
  computeCampaignProgression,
  type ProgressionCampaignDefinition,
} from "./plan-campaign-progression"

const res = (id: string) => id as EstimateResourceId
const bid = (id: string) => id as BattleId
const gid = (id: string) => id as CampaignId

const battle = (
  campaignGroupId: string,
  type: string,
  battleIndex: number,
  energyCost = 6
): Battle => ({
  campaignGroupId: gid(campaignGroupId),
  type,
  challenge: false,
  nodeNumber: battleIndex + 1,
  battleIndex,
  energyCost,
  dailyAttempts: 10,
})

const at = (battleId: string, effectiveRate: number): FarmLocation => ({
  battleId: bid(battleId),
  guaranteed: false,
  effectiveRate,
  numerator: null,
  denominator: null,
  isMythic: false,
})

// Indomitus Standard (campaign1): nodes 0-2, all reached. Indomitus Elite (elite1): nodes 0-4,
// frontier 1. Fall of Cadia Elite (elite2): nodes 0-3, never started. An event group is ignored.
const allBattlesById = new Map<BattleId, Battle>([
  [bid("c1-0"), battle("campaign1", "Standard", 0)],
  [bid("c1-1"), battle("campaign1", "Standard", 1)],
  [bid("c1-2"), battle("campaign1", "Standard", 2)],
  [bid("e1-0"), battle("elite1", "Elite", 0, 10)],
  [bid("e1-1"), battle("elite1", "Elite", 1, 10)],
  [bid("e1-2"), battle("elite1", "Elite", 2, 10)],
  [bid("e1-3"), battle("elite1", "Elite", 3, 10)],
  [bid("e1-4"), battle("elite1", "Elite", 4, 10)],
  [bid("e2-0"), battle("elite2", "Elite", 0, 10)],
  [bid("e2-3"), battle("elite2", "Elite", 3, 10)],
  [bid("ev-0"), battle("eventCampaign1", "Standard", 0)],
])
const reached = ["c1-0", "c1-1", "c1-2", "e1-0", "e1-1"].map(bid)
const battlesById = new Map(reached.map((id) => [id, allBattlesById.get(id)!]))

const definition = (
  groupId: string,
  type: string,
  extra: Partial<ProgressionCampaignDefinition> = {}
): [string, ProgressionCampaignDefinition] => [
  groupId,
  {
    groupId: gid(groupId),
    releaseType: "standard",
    coreCharacters: [],
    types: [type],
    requiredCampaignGroupId: null,
    ...extra,
  },
]
const definitionsByGroupId = new Map([
  definition("campaign1", "Standard"),
  definition("campaign2", "Standard"),
  definition("elite1", "Elite", {
    requiredCampaignGroupId: gid("campaign1"),
  }),
  definition("elite2", "Elite", {
    requiredCampaignGroupId: gid("campaign2"),
    coreCharacters: ["blackHaarken", "blackTerminator"],
  }),
  definition("eventCampaign1", "Standard", { releaseType: "event" }),
])

const farmLocationsById = new Map([
  // Farmed today at Indomitus 2 (6 energy / 0.2 = 30 per item); Indomitus Elite 4 drops it at
  // 10 / 0.5 = 20 per item.
  [res("matA"), { farmLocations: [at("c1-2", 0.2), at("e1-4", 0.5)] }],
  // Only Fall of Cadia Elite 4 (index 3) and the event drop it: blocked.
  [res("matB"), { farmLocations: [at("e2-3", 0.25), at("ev-0", 0.5)] }],
])

const goalNeeds: GoalNeed[] = [
  { goalId: "g1", priority: 1, needs: [{ id: res("matA"), count: 10 }] },
  { goalId: "g2", priority: 2, needs: [{ id: res("matB"), count: 4 }] },
]
const estimates = new Map<string, EstimateOutcome>([
  [
    "g2",
    {
      status: "Blocked",
      reason: "NoFarmLocation",
      resourceIds: [res("matB")],
      actionableResourceIds: [],
      blockers: [
        { resourceId: res("matB"), reason: "NoFarmLocation", remaining: 4 },
      ],
    },
  ],
])

const run = (
  overrides: Partial<Parameters<typeof computeCampaignProgression>[0]> = {}
) =>
  computeCampaignProgression({
    goalNeeds,
    allocations: new Map(),
    estimates,
    farmLocationsById,
    battlesById,
    allBattlesById,
    campaignProgressByKey: new Map([
      ["campaign1:Standard", { highestCompletedBattleIndex: 3 }],
      ["elite1:Elite", { highestCompletedBattleIndex: 1 }],
    ]),
    definitionsByGroupId,
    ownedUnitIds: new Set(["blackHaarken"]),
    powerLevel: 20,
    eliteCampaignMinPowerLevel: 25,
    isElite: (groupId) => groupId.startsWith("elite"),
    label: (id) => `label:${id}`,
    ...overrides,
  })

describe("computeCampaignProgression", () => {
  it("ranks tracks that unblock goals first, then by energy saved, with their lock reasons", () => {
    expect(run()).toEqual([
      {
        key: "elite2:Elite",
        campaignGroupId: "elite2",
        type: "Elite",
        battlesLeft: 4,
        started: false,
        energySaved: 0,
        unblocks: [
          {
            resourceId: "matB",
            label: "label:matB",
            count: 4,
            battlesToGo: 4,
            goalIds: ["g2"],
          },
        ],
        lockReasons: [
          { kind: "MissingCoreCharacters", unitIds: ["blackTerminator"] },
          { kind: "PowerLevelTooLow", required: 25, current: 20 },
        ],
      },
      {
        key: "elite1:Elite",
        campaignGroupId: "elite1",
        type: "Elite",
        battlesLeft: 4,
        started: true,
        // 10 items × (30 − 20) energy per item.
        energySaved: 100,
        unblocks: [],
        lockReasons: [{ kind: "PowerLevelTooLow", required: 25, current: 20 }],
      },
    ])
  })

  it("names an uncleared required campaign and skips cleared tracks", () => {
    const result = run({
      powerLevel: 30,
      campaignProgressByKey: new Map([
        ["campaign1:Standard", { highestCompletedBattleIndex: 1 }],
        ["elite1:Elite", { highestCompletedBattleIndex: 5 }],
      ]),
    })
    // Indomitus Elite is cleared; Indomitus Standard itself has no locked node worth pushing.
    expect(result.map((entry) => entry.key)).toEqual(["elite2:Elite"])
    expect(result[0]!.lockReasons).toEqual([
      { kind: "MissingCoreCharacters", unitIds: ["blackTerminator"] },
    ])

    const blockedByStandard = run({
      powerLevel: 30,
      campaignProgressByKey: new Map([
        ["campaign1:Standard", { highestCompletedBattleIndex: 1 }],
        ["elite1:Elite", { highestCompletedBattleIndex: 1 }],
      ]),
    }).find((entry) => entry.key === "elite1:Elite")
    expect(blockedByStandard?.lockReasons).toEqual([
      {
        kind: "RequiredCampaignNotCleared",
        campaignGroupId: "campaign1",
        type: "Standard",
        battlesLeft: 2,
      },
    ])
  })

  it("ignores goals pinned to their own nodes and returns nothing without needs", () => {
    const pinned = goalNeeds.map((goal) => ({
      ...goal,
      farmingLocationIds: ["c1-2"],
    }))
    expect(run({ goalNeeds: pinned }).map((entry) => entry.key)).toEqual([
      "elite2:Elite",
    ])
    expect(run({ goalNeeds: [] })).toEqual([])
  })
})
