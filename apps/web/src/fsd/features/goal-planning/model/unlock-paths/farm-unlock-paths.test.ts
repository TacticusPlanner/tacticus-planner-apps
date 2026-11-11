import { describe, expect, it } from "vitest"
import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

import { farmUnlockPaths } from "./farm-unlock-paths"

const id = (value: string) => value as BattleId

const battle = (
  campaignGroupId: string,
  type: string,
  battleIndex: number,
  energyCost = 6
): Battle => ({
  campaignGroupId: campaignGroupId as CampaignId,
  type,
  challenge: false,
  nodeNumber: battleIndex + 1,
  battleIndex,
  energyCost,
  dailyAttempts: 10,
})

const location = (
  battleId: string,
  rate: Partial<FarmLocation> = {}
): FarmLocation => ({
  battleId: id(battleId),
  guaranteed: false,
  effectiveRate: 0.2,
  numerator: null,
  denominator: null,
  isMythic: false,
  ...rate,
})

const allBattlesById = new Map<BattleId, Battle>([
  [id("cadiaElite22"), battle("fallOfCadia", "Elite", 22)],
  [id("cadiaElite16"), battle("fallOfCadia", "Elite", 16)],
  [id("octariusElite5"), battle("octarius", "Elite", 5)],
  [id("indomitus3"), battle("indomitus", "Standard", 3)],
  [id("event4"), battle("eventDeathGuard", "eventStandard", 4)],
  [id("free"), battle("indomitus", "Standard", 1, 0)],
])

const run = (
  farmLocations: FarmLocation[],
  eligible: string[] = ["indomitus3"]
) =>
  farmUnlockPaths({
    farmLocations,
    allBattlesById,
    eligibleBattleIds: new Set(eligible.map(id)),
    campaignProgressByKey: new Map([
      ["fallOfCadia:Elite", { highestCompletedBattleIndex: 15 }],
    ]),
    isEventGroup: (groupId) => groupId.startsWith("event"),
  })

describe("farmUnlockPaths", () => {
  it("counts the battles from the track's frontier to the node, closest first, events last", () => {
    expect(
      run([
        location("event4"),
        location("cadiaElite22"),
        location("octariusElite5"),
      ])
    ).toEqual([
      // Octarius Elite has no progress: battles 0..5 are still to beat.
      {
        kind: "campaign",
        battleId: "octariusElite5",
        battlesToGo: 6,
        started: false,
      },
      // The frontier (index 15) is not beaten yet: 15..22.
      {
        kind: "campaign",
        battleId: "cadiaElite22",
        battlesToGo: 8,
        started: true,
      },
      { kind: "event", battleId: "event4" },
    ])
  })

  it("leaves out reachable, unknown, free and no-drop nodes, and lists a node once", () => {
    expect(
      run([
        location("indomitus3"),
        location("unknown"),
        location("free"),
        location("cadiaElite22", { effectiveRate: 0 }),
        location("cadiaElite16", { guaranteed: true, effectiveRate: null }),
        location("cadiaElite16"),
      ])
    ).toEqual([
      {
        kind: "campaign",
        battleId: "cadiaElite16",
        battlesToGo: 2,
        started: true,
      },
    ])
  })

  it("returns nothing for a resource without catalog locations", () => {
    expect(run([])).toEqual([])
  })
})
