import { describe, expect, it } from "vitest"

import { buildEffectiveCampaignEventProgress } from "./campaign-event-progress"
import type { SyncedCampaignEventProgress } from "./campaign-event-progress"
import type { CampaignEventProgressOverride } from "./types"

import {
  availableCampaignBattles,
  manualBattleIds,
} from "./campaign-event-eligibility"
import { compareCodeUnits } from "@/shared/lib"

// daily-raids-today, "Only the active campaign event is farmable": event node eligibility reads the
// effective progress (a manual count above the synced one, else synced, else none), not the synced
// chunk alone.

const ACTIVE = "eventCampaign1"
const eventIds = new Set([ACTIVE])

const battle = (
  id: string,
  type: string,
  nodeNumber: number,
  challenge = false
) => ({
  id,
  campaignGroupId: ACTIVE,
  type,
  challenge,
  nodeNumber,
  battleIndex: nodeNumber - 1,
})

const synced = (
  type: string,
  completedBattleCount: number,
  completedChallengeBattlesIds: string[] = []
): SyncedCampaignEventProgress => ({
  tacticusCampaignId: ACTIVE,
  type,
  completedBattleCount,
  completedChallengeBattlesIds,
})

const override = (
  type: "Standard" | "Extremis",
  patch: Partial<CampaignEventProgressOverride>
): CampaignEventProgressOverride => ({
  campaignGroupId: ACTIVE,
  type,
  completedBattleCount: null,
  completedChallengeBattlesIds: null,
  ...patch,
})

const eligibleIds = (
  battles: ReturnType<typeof battle>[],
  syncedEntries: SyncedCampaignEventProgress[],
  overrides: CampaignEventProgressOverride[]
) =>
  availableCampaignBattles(
    battles,
    eventIds,
    ACTIVE,
    buildEffectiveCampaignEventProgress(syncedEntries, overrides)
  ).map((entry) => entry.id)

describe("event node eligibility from effective progress", () => {
  it("matches synced-only eligibility exactly when there are no overrides", () => {
    // Regression guard for Today, Raids Plan and the Home raids widget, which all consume this
    // map through useDailyRaids: a profile without overrides must see the same schedule as before.
    const battles = [
      battle("AMS15", "Standard", 15),
      battle("AMS16", "Standard", 16),
      battle("AMS17", "Standard", 17),
      battle("AMS3B", "Standard", 3, true),
      battle("AMS7B", "Standard", 7, true),
      battle("AME1", "Extremis", 1),
    ]
    expect(
      eligibleIds(battles, [synced("Standard", 15, ["AMS3B"])], [])
    ).toEqual(["AMS15", "AMS16", "AMS3B"])
  })

  it("excludes a node with neither synced data nor an override", () => {
    expect(eligibleIds([battle("AME12", "Extremis", 12)], [], [])).toEqual([])
  })

  it("keeps a track without a battle count unreached when an override sets only challenges", () => {
    // No synced entry and no manual count: the regular nodes have no progress source at all, so
    // even node 1 stays unreached; only the manually completed challenge is eligible.
    expect(
      eligibleIds(
        [battle("AME1", "Extremis", 1), battle("AME3B", "Extremis", 3, true)],
        [],
        [override("Extremis", { completedChallengeBattlesIds: ["AME3B"] })]
      )
    ).toEqual(["AME3B"])
  })

  it("keeps a track unreached for a legacy override with both values unset", () => {
    expect(
      eligibleIds(
        [battle("AME1", "Extremis", 1)],
        [],
        [override("Extremis", {})]
      )
    ).toEqual([])
  })

  it("admits a node without synced data once a manual override reaches it", () => {
    expect(
      eligibleIds(
        [battle("AME12", "Extremis", 12)],
        [],
        [override("Extremis", { completedBattleCount: 11 })]
      )
    ).toEqual(["AME12"])
  })

  it("keeps a node synced progress reaches when a stale manual override is lower", () => {
    const battles = [battle("AMS12", "Standard", 12)]
    expect(
      eligibleIds(
        battles,
        [synced("Standard", 15)],
        [override("Standard", { completedBattleCount: 5 })]
      )
    ).toEqual(["AMS12"])
  })

  it("reaches event nodes past node 1 despite a V1-imported 0 override", () => {
    // The V1 import saves V1's default 0 for every event track as a manual override. With nodes
    // 1-3 synced as beaten, node 4 is reached, so "CE nodes first" can farm it.
    const battles = [
      battle("AMS1", "Standard", 1),
      battle("AMS4", "Standard", 4),
      battle("AMS5", "Standard", 5),
    ]
    expect(
      eligibleIds(
        battles,
        [synced("Standard", 3)],
        [override("Standard", { completedBattleCount: 0 })]
      )
    ).toEqual(["AMS1", "AMS4"])
  })

  it("lets a manual override above synced progress reach further nodes", () => {
    expect(
      eligibleIds(
        [battle("AMS12", "Standard", 12)],
        [synced("Standard", 5)],
        [override("Standard", { completedBattleCount: 11 })]
      )
    ).toEqual(["AMS12"])
  })

  it("resolves a challenge override independently of the synced battle count", () => {
    expect(
      eligibleIds(
        [
          battle("AMS16", "Standard", 16),
          battle("AMS17", "Standard", 17),
          battle("AMS7B", "Standard", 7, true),
        ],
        [synced("Standard", 15)],
        [override("Standard", { completedChallengeBattlesIds: ["AMS7B"] })]
      )
    ).toEqual(["AMS16", "AMS7B"])
  })
})

describe("manualBattleIds", () => {
  const standing = (id: string, battleIndex: number) => ({
    id,
    campaignGroupId: "elite2",
    type: "Elite",
    battleIndex,
  })

  it("marks the standing frontier and battles recorded below 3 medals", () => {
    const ids = manualBattleIds(
      [standing("FoCE1", 0), standing("FoCE2", 1), standing("FoCE3", 2)],
      new Set(),
      new Map([["elite2:Elite", { highestCompletedBattleIndex: 2 }]]),
      [
        { battleId: "FoCE1", medals: 2 },
        { battleId: "FoCE2", medals: 3 },
      ]
    )
    expect([...ids].toSorted(compareCodeUnits)).toEqual(["FoCE1", "FoCE3"])
  })

  it("never treats an event battle as a standing frontier", () => {
    const ids = manualBattleIds(
      [
        {
          id: "AMS01",
          campaignGroupId: ACTIVE,
          type: "Standard",
          battleIndex: 0,
        },
      ],
      eventIds,
      new Map([[`${ACTIVE}:Standard`, { highestCompletedBattleIndex: 0 }]]),
      []
    )
    expect(ids.size).toBe(0)
  })
})
