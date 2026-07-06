import { describe, expect, it } from "vitest"

import {
  getEffectiveBattleResults,
  getEffectiveCampaignProgress,
  type BattleResultOverride,
  type CampaignProgressOverride,
} from "./player-data-merge"
import type { PlayerDataChunkPayload } from "./types"

type CampaignProgress = PlayerDataChunkPayload<"campaign-progress">[number]

function campaign(overrides: Partial<CampaignProgress> = {}): CampaignProgress {
  return {
    tacticusCampaignId: "campaign1",
    catalogCampaignGroupId: "campaign1",
    name: "Indomitus",
    type: "Standard",
    battles: [
      { battleIndex: 0, attemptsLeft: 3, attemptsUsed: 0 },
      { battleIndex: 1, attemptsLeft: 3, attemptsUsed: 0 },
    ],
    highestObservedBattleIndex: 1,
    ...overrides,
  }
}

describe("getEffectiveBattleResults", () => {
  it("defaults every battle to the maximum result when no override exists", () => {
    const results = getEffectiveBattleResults(campaign(), [])

    expect(results).toEqual([
      {
        battleIndex: 0,
        medal: 3,
        lightningVictory: true,
        victoryWithoutBorrowed: null,
        isOverridden: false,
      },
      {
        battleIndex: 1,
        medal: 3,
        lightningVictory: true,
        victoryWithoutBorrowed: null,
        isOverridden: false,
      },
    ])
  })

  it("defaults victoryWithoutBorrowed to true (not null) for campaign-event battles", () => {
    const eventCampaign = campaign({
      tacticusCampaignId: "eventCampaign6",
      battles: [{ battleIndex: 0, attemptsLeft: 10, attemptsUsed: 0 }],
    })

    const results = getEffectiveBattleResults(eventCampaign, [])

    expect(results[0]?.victoryWithoutBorrowed).toBe(true)
  })

  it("applies a matching override instead of the maximum default", () => {
    const overrides: BattleResultOverride[] = [
      {
        tacticusCampaignId: "campaign1",
        battleIndex: 1,
        medal: 1,
        lightningVictory: false,
        victoryWithoutBorrowed: null,
      },
    ]

    const results = getEffectiveBattleResults(campaign(), overrides)

    expect(results[0]).toEqual({
      battleIndex: 0,
      medal: 3,
      lightningVictory: true,
      victoryWithoutBorrowed: null,
      isOverridden: false,
    })
    expect(results[1]).toEqual({
      battleIndex: 1,
      medal: 1,
      lightningVictory: false,
      victoryWithoutBorrowed: null,
      isOverridden: true,
    })
  })

  it("ignores overrides for a different campaign id", () => {
    const overrides: BattleResultOverride[] = [
      {
        tacticusCampaignId: "campaign2",
        battleIndex: 0,
        medal: 1,
        lightningVictory: false,
        victoryWithoutBorrowed: null,
      },
    ]

    const results = getEffectiveBattleResults(campaign(), overrides)

    expect(results.every((result) => !result.isOverridden)).toBe(true)
  })
})

describe("getEffectiveCampaignProgress", () => {
  it("marks synced campaigns as source 'synced' and passes them through unchanged", () => {
    const result = getEffectiveCampaignProgress([campaign()], [])

    expect(result).toEqual([{ ...campaign(), source: "synced" }])
  })

  it("fills in a manual entry for a campaign the sync doesn't cover", () => {
    const overrides: CampaignProgressOverride[] = [
      { catalogCampaignGroupId: "mirror1", highestCompletedNodeNumber: 12 },
    ]

    const result = getEffectiveCampaignProgress([campaign()], overrides)

    expect(result).toHaveLength(2)
    const manual = result.find(
      (entry) => entry.catalogCampaignGroupId === "mirror1"
    )
    expect(manual).toMatchObject({
      source: "manual",
      highestObservedBattleIndex: 12,
    })
  })

  it("never lets a manual entry override a synced campaign for the same catalog group", () => {
    const overrides: CampaignProgressOverride[] = [
      { catalogCampaignGroupId: "campaign1", highestCompletedNodeNumber: 999 },
    ]

    const result = getEffectiveCampaignProgress([campaign()], overrides)

    expect(result).toHaveLength(1)
    expect(result[0]?.source).toBe("synced")
    expect(result[0]?.highestObservedBattleIndex).toBe(1)
  })
})
