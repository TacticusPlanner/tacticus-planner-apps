import { describe, expect, it } from "vitest"

import {
  buildEffectiveCampaignEventProgress,
  type CampaignEventProgressOverride,
  type SyncedCampaignEventProgress,
} from "@/entities/player-data-override"

import { availableCampaignBattles } from "./campaign-event-eligibility"

// daily-raids-today, "Only the active campaign event is farmable": event node eligibility reads the
// effective progress (manual override, else synced, else none), not the synced chunk alone.

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

  it("admits a node without synced data once a manual override reaches it", () => {
    expect(
      eligibleIds(
        [battle("AME12", "Extremis", 12)],
        [],
        [override("Extremis", { completedBattleCount: 11 })]
      )
    ).toEqual(["AME12"])
  })

  it("lets a manual override lower than synced progress exclude a node", () => {
    const battles = [battle("AMS12", "Standard", 12)]
    expect(eligibleIds(battles, [synced("Standard", 15)], [])).toEqual([
      "AMS12",
    ])
    expect(
      eligibleIds(
        battles,
        [synced("Standard", 15)],
        [override("Standard", { completedBattleCount: 5 })]
      )
    ).toEqual([])
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
