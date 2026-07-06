import { describe, expect, it } from "vitest"

import {
  getEffectiveBattleResults,
  getEffectiveCampaignProgress,
  type BattleResultOverride,
  type CampaignProgressOverride,
} from "./player-data-merge"
import type { PlayerDataChunkPayload } from "./types"

type CampaignProgress = PlayerDataChunkPayload<"campaign-progress">[number]
type BattleAttempt =
  PlayerDataChunkPayload<"live-progress">["battleAttempts"][number]

function campaign(overrides: Partial<CampaignProgress> = {}): CampaignProgress {
  return {
    tacticusCampaignId: "campaign1",
    type: "Standard",
    highestCompletedBattleIndex: 1,
    ...overrides,
  }
}

function battleAttempts(
  overrides: Partial<BattleAttempt>[] = [
    { battleIndex: 0, attemptsLeft: 3, attemptsUsed: 0 },
    { battleIndex: 1, attemptsLeft: 3, attemptsUsed: 0 },
  ]
): BattleAttempt[] {
  return overrides.map((override) => ({
    tacticusCampaignId: "campaign1",
    battleIndex: 0,
    attemptsLeft: 0,
    attemptsUsed: 0,
    ...override,
  }))
}

describe("getEffectiveBattleResults", () => {
  it("defaults every battle to the maximum result when no override exists", () => {
    const results = getEffectiveBattleResults("campaign1", battleAttempts(), [])

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
    const results = getEffectiveBattleResults(
      "eventCampaign6",
      battleAttempts([
        {
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 0,
          attemptsLeft: 10,
          attemptsUsed: 0,
        },
      ]),
      []
    )

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

    const results = getEffectiveBattleResults(
      "campaign1",
      battleAttempts(),
      overrides
    )

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

    const results = getEffectiveBattleResults(
      "campaign1",
      battleAttempts(),
      overrides
    )

    expect(results.every((result) => !result.isOverridden)).toBe(true)
  })

  it("only returns battle attempts belonging to the requested campaign id", () => {
    const results = getEffectiveBattleResults(
      "campaign1",
      battleAttempts([
        { battleIndex: 0, attemptsLeft: 3, attemptsUsed: 0 },
        {
          tacticusCampaignId: "mirror1",
          battleIndex: 0,
          attemptsLeft: 3,
          attemptsUsed: 0,
        },
      ]),
      []
    )

    expect(results).toHaveLength(1)
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
      (entry) => entry.tacticusCampaignId === "mirror1"
    )
    expect(manual).toMatchObject({
      source: "manual",
      highestCompletedBattleIndex: 12,
    })
  })

  it("never lets a manual entry override a synced campaign for the same catalog group", () => {
    const overrides: CampaignProgressOverride[] = [
      { catalogCampaignGroupId: "campaign1", highestCompletedNodeNumber: 999 },
    ]

    const result = getEffectiveCampaignProgress([campaign()], overrides)

    expect(result).toHaveLength(1)
    expect(result[0]?.source).toBe("synced")
    expect(result[0]?.highestCompletedBattleIndex).toBe(1)
  })
})
