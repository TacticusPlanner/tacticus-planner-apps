import { describe, expect, it } from "vitest"

import {
  buildEffectiveCampaignEventProgress,
  campaignEventTrackKey,
  resolveCampaignEventProgress,
  type SyncedCampaignEventProgress,
} from "./campaign-event-progress"
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
    })
  })

  it("reports no progress and source none when neither exists", () => {
    expect(resolveCampaignEventProgress(undefined, undefined)).toEqual({
      completedBattleCount: 0,
      completedChallengeBattlesIds: [],
      battleSource: "none",
      challengeSource: "none",
    })
  })

  it("lets a manual value lower than synced progress win", () => {
    expect(
      resolveCampaignEventProgress(
        synced({ completedBattleCount: 15 }),
        override({ completedBattleCount: 5 })
      ).completedBattleCount
    ).toBe(5)
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
