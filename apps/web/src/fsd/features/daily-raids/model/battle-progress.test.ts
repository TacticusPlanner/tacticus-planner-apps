import { describe, expect, it } from "vitest"

import {
  beatenEventBattleRows,
  medalsOf,
  progressOf,
  reachedBattleRows,
  sumRewards,
  unclaimedMedalRewards,
  unclaimedEventRewardTracks,
  unclaimedMilestoneRewards,
  withBattleProgress,
  withGold,
  withMedals,
} from "./battle-progress"

const battle = (
  id: string,
  battleIndex: number,
  campaignGroupId = "elite2",
  type = "Elite"
) => ({
  id,
  campaignGroupId,
  type,
  nodeNumber: battleIndex + 1,
  battleIndex,
})

describe("reachedBattleRows", () => {
  const battles = [
    battle("FoCE3", 2),
    battle("FoCE1", 0),
    battle("FoCE2", 1),
    battle("FoCE4", 3),
    battle("IE1", 0, "elite1"),
    battle("FoCX1", 0, "elite2", "Mirror"),
  ]

  it("lists the track's battles up to the frontier, in node order", () => {
    expect(reachedBattleRows(battles, "elite2", "Elite", 2)).toEqual([
      { battleId: "FoCE1", nodeNumber: 1, challenge: false, frontier: false },
      { battleId: "FoCE2", nodeNumber: 2, challenge: false, frontier: false },
      { battleId: "FoCE3", nodeNumber: 3, challenge: false, frontier: true },
    ])
  })

  it("lists nothing for a track with no progress", () => {
    expect(reachedBattleRows(battles, "elite2", "Elite", undefined)).toEqual([])
  })
})

describe("withMedals", () => {
  it("records a battle below 3 medals and reads it back", () => {
    const next = withMedals([], "FoCE38", 2)
    expect(next).toEqual([
      {
        battleId: "FoCE38",
        medals: 2,
        lightningVictory: null,
        milestone: null,
      },
    ])
    expect(medalsOf(next, "FoCE38")).toBe(2)
    expect(medalsOf(next, "FoCE37")).toBe(3)
  })

  it("drops an entry set back to 3 medals with nothing else recorded", () => {
    expect(withMedals(withMedals([], "FoCE38", 1), "FoCE38", 3)).toEqual([])
  })

  it("keeps an entry at 3 medals that still records a milestone", () => {
    const saved = [
      {
        battleId: "AMS01",
        medals: 2,
        lightningVictory: true,
        milestone: "Gold" as const,
      },
    ]
    expect(withMedals(saved, "AMS01", 3)).toEqual([
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: true,
        milestone: "Gold",
      },
    ])
  })
})

describe("beatenEventBattleRows", () => {
  const event = (
    id: string,
    nodeNumber: number,
    battleIndex: number,
    challenge = false
  ) => ({
    id,
    campaignGroupId: "eventCampaign1",
    type: "Standard",
    challenge,
    nodeNumber,
    battleIndex,
  })
  const battles = [
    event("AMS01", 1, 0),
    event("AMS02", 2, 1),
    event("AMSC2B", 2, 2, true),
    event("AMS03", 3, 3),
    event("AMSC3B", 3, 4, true),
  ]

  it("lists the beaten regular nodes and the completed challenge battles", () => {
    const rows = beatenEventBattleRows(battles, "eventCampaign1", "Standard", {
      completedBattleCount: 2,
      completedChallengeBattlesIds: ["AMSC3B"],
    })
    expect(
      rows.map((row) => [row.battleId, row.challenge, row.frontier])
    ).toEqual([
      ["AMS01", false, false],
      ["AMS02", false, false],
      ["AMSC3B", true, false],
    ])
  })

  it("lists nothing for a track with no progress", () => {
    expect(
      beatenEventBattleRows(battles, "eventCampaign1", "Standard", undefined)
    ).toEqual([])
  })
})

describe("event progress", () => {
  it("defaults a battle with no entry to 3 medals, no Lightning Victory and no milestone", () => {
    expect(progressOf([], "AMS01")).toEqual({
      medals: 3,
      lightningVictory: false,
      milestone: null,
    })
  })

  it("records a milestone and drops the entry once it is cleared again", () => {
    const withSilver = withBattleProgress([], "AMS01", { milestone: "Silver" })
    expect(withSilver).toEqual([
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: null,
        milestone: "Silver",
      },
    ])
    expect(
      withBattleProgress(withSilver, "AMS01", { milestone: null })
    ).toEqual([])
  })

  it("sets 3 medals and a Lightning Victory with a Gold milestone", () => {
    expect(withGold(withMedals([], "AMS01", 1), "AMS01")).toEqual([
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: true,
        milestone: "Gold",
      },
    ])
  })
})

describe("unclaimed rewards", () => {
  const medals = [
    { medals: 1, id: "xpCommon", min: 1, max: 1 },
    { medals: 2, id: "gold", min: 50, max: 50 },
    { medals: 3, id: "shards_necroWarden", min: 5, max: 5 },
  ]
  const milestones = [
    { milestone: "Bronze" as const, id: "upgHpC015", min: 1, max: 1 },
    { milestone: "Silver" as const, id: "xpCommon", min: 2, max: 2 },
    { milestone: "Gold" as const, id: "gold", min: 100, max: 150 },
  ]

  it("keeps the medal rewards above the medals earned", () => {
    expect(
      unclaimedMedalRewards(medals, 1).map((reward) => reward.medals)
    ).toEqual([2, 3])
    expect(unclaimedMedalRewards(medals, 3)).toEqual([])
  })

  it("keeps the milestone tiers above the one recorded", () => {
    expect(unclaimedMilestoneRewards(milestones, null)).toHaveLength(3)
    expect(
      unclaimedMilestoneRewards(milestones, "Silver").map(
        (reward) => reward.milestone
      )
    ).toEqual(["Gold"])
    expect(unclaimedMilestoneRewards(milestones, "Gold")).toEqual([])
  })

  it("sums rewards by id", () => {
    expect(sumRewards([...medals, ...milestones])).toEqual([
      { id: "xpCommon", min: 3, max: 3 },
      { id: "gold", min: 150, max: 200 },
      { id: "shards_necroWarden", min: 5, max: 5 },
      { id: "upgHpC015", min: 1, max: 1 },
    ])
  })
})

describe("unclaimedEventRewardTracks", () => {
  const rewards = {
    medals: [{ medals: 3, id: "shards_necroWarden", min: 5, max: 5 }],
    milestones: [
      { milestone: "Silver" as const, id: "xpCommon", min: 2, max: 2 },
      { milestone: "Gold" as const, id: "gold", min: 100, max: 100 },
    ],
  }
  const event = (id: string, nodeNumber: number, type = "Standard") => ({
    id,
    campaignGroupId: "eventCampaign1",
    type,
    challenge: false,
    nodeNumber,
    battleIndex: nodeNumber - 1,
    rewards,
  })
  const definitions = [
    { groupId: "campaign1", releaseType: "standard", types: ["Standard"] },
    {
      groupId: "eventCampaign1",
      releaseType: "event",
      types: ["Standard", "Extremis"],
    },
  ]
  const battles = [
    event("AMS01", 1),
    event("AMS02", 2),
    event("AME01", 1, "Extremis"),
  ]
  const progress = (_groupId: string, type: string) =>
    type === "Standard"
      ? { completedBattleCount: 2, completedChallengeBattlesIds: [] }
      : undefined

  it("sums each beaten event track's unclaimed rewards and skips claimed battles", () => {
    const overrides = withGold(withMedals([], "AMS01", 2), "AMS01")
    expect(
      unclaimedEventRewardTracks(definitions, battles, progress, overrides)
    ).toEqual([
      {
        groupId: "eventCampaign1",
        type: "Standard",
        battleCount: 1,
        rewards: [
          { id: "xpCommon", min: 2, max: 2 },
          { id: "gold", min: 100, max: 100 },
        ],
      },
    ])
  })
})
