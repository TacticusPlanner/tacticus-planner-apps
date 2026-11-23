import { describe, expect, it } from "vitest"

import {
  buildEffectiveCampaignEventProgress,
  campaignEventTrackKey,
  resolveCampaignEventProgress,
} from "./campaign-event-progress"
import type { SyncedCampaignEventProgress } from "./campaign-event-progress"
import type { CampaignEventProgressOverride } from "./types"

const synced = (
  patch: Partial<SyncedCampaignEventProgress> = {}
): SyncedCampaignEventProgress => ({
  tacticusCampaignId: "eventCampaign1",
  type: "Standard",
  completedBattleCount: 8,
  completedChallengeBattlesIds: ["AMS3B"],
  ...patch,
})

const override = (
  patch: Partial<CampaignEventProgressOverride> = {}
): CampaignEventProgressOverride => ({
  campaignGroupId: "eventCampaign1",
  type: "Standard",
  completedBattleCount: null,
  completedChallengeBattlesIds: null,
  ...patch,
})

describe("resolveCampaignEventProgress", () => {
  it("prefers a manual value over synced data", () => {
    expect(
      resolveCampaignEventProgress(
        synced(),
        override({ completedBattleCount: 12 })
      )
    ).toMatchObject({ completedBattleCount: 12, battleSource: "manual" })
  })

  it("uses synced data when no override exists", () => {
    expect(resolveCampaignEventProgress(synced(), undefined)).toEqual({
      completedBattleCount: 8,
      completedChallengeBattlesIds: ["AMS3B"],
      battleSource: "synced",
      challengeSource: "synced",
      syncedBattleCount: 8,
    })
  })

  it("reports no progress and source none when neither exists", () => {
    expect(resolveCampaignEventProgress(undefined, undefined)).toEqual({
      completedBattleCount: 0,
      completedChallengeBattlesIds: [],
      battleSource: "none",
      challengeSource: "none",
      syncedBattleCount: null,
    })
  })

  it("lets synced progress win over a lower, stale manual value", () => {
    expect(
      resolveCampaignEventProgress(
        synced({ completedBattleCount: 15 }),
        override({ completedBattleCount: 5 })
      )
    ).toMatchObject({
      completedBattleCount: 15,
      battleSource: "synced",
      syncedBattleCount: 15,
    })
  })

  it("lets synced progress win over a V1-imported 0 once the player has played the event", () => {
    // V1 stored 0 for every event track by default, and the V1 import saves it as an override.
    expect(
      resolveCampaignEventProgress(
        synced({ completedBattleCount: 3 }),
        override({ completedBattleCount: 0 })
      )
    ).toMatchObject({ completedBattleCount: 3, battleSource: "synced" })
  })

  it("reports a manual value equal to synced progress as synced", () => {
    expect(
      resolveCampaignEventProgress(
        synced({ completedBattleCount: 8 }),
        override({ completedBattleCount: 8 })
      )
    ).toMatchObject({ completedBattleCount: 8, battleSource: "synced" })
  })

  it("keeps a manual value when nothing is synced", () => {
    expect(
      resolveCampaignEventProgress(
        undefined,
        override({ completedBattleCount: 0 })
      )
    ).toMatchObject({
      completedBattleCount: 0,
      battleSource: "manual",
      syncedBattleCount: null,
    })
  })

  it("resolves battle count and challenge ids independently", () => {
    expect(
      resolveCampaignEventProgress(
        synced({ completedBattleCount: 15, completedChallengeBattlesIds: [] }),
        override({ completedChallengeBattlesIds: ["AMS7B"] })
      )
    ).toEqual({
      completedBattleCount: 15,
      completedChallengeBattlesIds: ["AMS7B"],
      battleSource: "synced",
      challengeSource: "manual",
      syncedBattleCount: 15,
    })
  })

  it("treats a manual empty challenge list as manual, not missing", () => {
    expect(
      resolveCampaignEventProgress(
        synced(),
        override({ completedChallengeBattlesIds: [] })
      )
    ).toMatchObject({
      completedChallengeBattlesIds: [],
      challengeSource: "manual",
    })
  })
})

describe("buildEffectiveCampaignEventProgress", () => {
  it("keys every track with synced data or an override", () => {
    const result = buildEffectiveCampaignEventProgress(
      [synced()],
      [
        override({
          type: "Extremis",
          completedBattleCount: 11,
        }),
      ]
    )
    expect(
      result.get(campaignEventTrackKey("eventCampaign1", "Standard"))
    ).toMatchObject({ completedBattleCount: 8, battleSource: "synced" })
    expect(
      result.get(campaignEventTrackKey("eventCampaign1", "Extremis"))
    ).toMatchObject({
      completedBattleCount: 11,
      battleSource: "manual",
      challengeSource: "none",
    })
    expect(result.size).toBe(2)
  })
})
