import { describe, expect, it } from "vitest"
import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

import type { CampaignGateContext } from "./campaign-track-gate"
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
    isEventGroup: (groupId) => groupId.startsWith("event"),
    gate: {
      lastIndexByKey: new Map(),
      campaignProgressByKey: new Map([
        ["fallOfCadia:Elite", { highestCompletedBattleIndex: 15 }],
      ]),
      definitionsByGroupId: new Map(),
      ownedUnitIds: undefined,
      powerLevel: undefined,
      eliteCampaignMinPowerLevel: undefined,
      isElite: () => false,
    },
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
        prerequisiteBattles: 0,
        lockReasons: [],
        started: false,
      },
      // The frontier (index 15) is not beaten yet: 15..22.
      {
        kind: "campaign",
        battleId: "cadiaElite22",
        battlesToGo: 8,
        prerequisiteBattles: 0,
        lockReasons: [],
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
        prerequisiteBattles: 0,
        lockReasons: [],
        started: true,
      },
    ])
  })

  it("returns nothing for a resource without catalog locations", () => {
    expect(run([])).toEqual([])
  })

  // The verification fixture: Fall of Cadia Standard at 30/75, its Elite not started, Power Level
  // 20, Kut not owned (the Mirror's core hero).
  describe("with campaign gates", () => {
    const gid = (value: string) => value as CampaignId
    const gated = new Map<BattleId, Battle>([
      [id("focStd53"), battle("foc", "Standard", 53)],
      [id("focStd74"), battle("foc", "Standard", 74)],
      [id("focElite2"), battle("focElite", "Elite", 2)],
      [id("focElite39"), battle("focElite", "Elite", 39)],
      [id("focMirror10"), battle("focMirror", "Mirror", 10)],
      [id("focMirror54"), battle("focMirror", "Mirror", 54)],
    ])
    const definition = (
      groupId: string,
      type: string,
      extra: {
        coreCharacters?: string[]
        requiredCampaignGroupId?: string
      } = {}
    ) =>
      [
        groupId,
        {
          groupId: gid(groupId),
          releaseType: "standing",
          coreCharacters: extra.coreCharacters ?? [],
          types: [type],
          requiredCampaignGroupId: extra.requiredCampaignGroupId
            ? gid(extra.requiredCampaignGroupId)
            : null,
        },
      ] as const
    const gate: CampaignGateContext = {
      lastIndexByKey: new Map([
        ["foc:Standard", 74],
        ["focElite:Elite", 39],
        ["focMirror:Mirror", 54],
      ]),
      campaignProgressByKey: new Map([
        ["foc:Standard", { highestCompletedBattleIndex: 30 }],
      ]),
      definitionsByGroupId: new Map([
        definition("foc", "Standard"),
        definition("focElite", "Elite", { requiredCampaignGroupId: "foc" }),
        definition("focMirror", "Mirror", { coreCharacters: ["kut"] }),
      ]),
      ownedUnitIds: new Set(["other"]),
      powerLevel: 20,
      eliteCampaignMinPowerLevel: 25,
      isElite: (groupId) => groupId === "focElite",
    }
    const runGated = (farmLocations: FarmLocation[]) =>
      farmUnlockPaths({
        farmLocations,
        allBattlesById: gated,
        eligibleBattleIds: new Set(),
        isEventGroup: () => false,
        gate,
      })

    it("counts the base campaign into an Elite node's distance and ranks it after open tracks", () => {
      const paths = runGated([
        location("focElite2"),
        location("focStd53"),
        location("focMirror10"),
      ])
      expect(paths.map((path) => path.battleId)).toEqual([
        "focStd53",
        "focElite2",
        "focMirror10",
      ])
      expect(paths[1]).toEqual({
        kind: "campaign",
        battleId: "focElite2",
        battlesToGo: 3,
        // Standard frontier 30 through 74.
        prerequisiteBattles: 45,
        lockReasons: [
          {
            kind: "RequiredCampaignNotCleared",
            campaignGroupId: "foc",
            type: "Standard",
            battlesLeft: 45,
          },
          { kind: "PowerLevelTooLow", required: 25, current: 20 },
        ],
        started: false,
      })
      expect(paths[2]).toMatchObject({
        lockReasons: [{ kind: "MissingCoreCharacters", unitIds: ["kut"] }],
      })
    })

    it("ranks by total battles when nothing else is in the way", () => {
      const open = { ...gate, powerLevel: 30, ownedUnitIds: new Set(["kut"]) }
      const paths = farmUnlockPaths({
        farmLocations: [location("focElite2"), location("focStd53")],
        allBattlesById: gated,
        eligibleBattleIds: new Set(),
        isEventGroup: () => false,
        gate: open,
      })
      // Standard 53 is 24 away; Elite 2 is 45 + 3.
      expect(paths.map((path) => path.battleId)).toEqual([
        "focStd53",
        "focElite2",
      ])
    })
  })
})
