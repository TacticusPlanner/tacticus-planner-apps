import { describe, expect, it } from "vitest"

import {
  beatenEventBattleRows,
  isBestProgress,
  medalsOf,
  progressOf,
  reachedBattleRows,
  sumRewards,
  unclaimedMedalRewards,
  unclaimedEventRewardTracks,
  unclaimedMilestoneRewards,
  trackMedalStats,
  withBattleProgress,
  withBest,
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

const plain = { lightningVictoryTurns: null, milestones: [] }
const lightning = { lightningVictoryTurns: 5, milestones: [] }
const event = {
  lightningVictoryTurns: 5,
  milestones: ["Bronze", "Silver", "Gold"] as const,
}

describe("withMedals", () => {
  it("records a battle below 3 medals and reads it back", () => {
    const next = withMedals([], "FoCE38", plain, 2)
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

  it("drops an entry set back to 3 medals with nothing else short", () => {
    expect(
      withMedals(withMedals([], "FoCE38", plain, 1), "FoCE38", plain, 3)
    ).toEqual([])
  })

  it("keeps an entry at 3 medals that still records a missed milestone", () => {
    const saved = [
      {
        battleId: "AMS01",
        medals: 2,
        lightningVictory: null,
        milestone: "Silver" as const,
      },
    ]
    expect(withMedals(saved, "AMS01", event, 3)).toEqual([
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: null,
        milestone: "Silver",
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

describe("battle progress defaults", () => {
  it("treats a battle with no entry as the best result", () => {
    expect(progressOf([], "FoCE1", plain)).toEqual({
      medals: 3,
      lightningVictory: false,
      milestone: null,
    })
    expect(progressOf([], "FoCE1", lightning)).toEqual({
      medals: 3,
      lightningVictory: true,
      milestone: null,
    })
    expect(progressOf([], "AMS01", event)).toEqual({
      medals: 3,
      lightningVictory: true,
      milestone: "Gold",
    })
  })

  it("stores only what fell short and drops the entry once back at best", () => {
    const short = withBattleProgress([], "AMS01", event, {
      lightningVictory: false,
      milestone: null,
    })
    expect(short).toEqual([
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: false,
        milestone: "None",
      },
    ])
    expect(progressOf(short, "AMS01", event)).toEqual({
      medals: 3,
      lightningVictory: false,
      milestone: null,
    })
    expect(
      withBattleProgress(short, "AMS01", event, {
        lightningVictory: true,
        milestone: "Gold",
      })
    ).toEqual([])
  })

  it("resets a battle to the best result", () => {
    const saved = withMedals([], "AMS01", event, 1)
    expect(withBest(saved, "AMS01")).toEqual([])
    expect(isBestProgress(progressOf([], "AMS01", event), event)).toBe(true)
  })
})

describe("trackMedalStats", () => {
  const battles = [
    { id: "FoCE1", battleIndex: 0, lightningVictoryTurns: 5 },
    { id: "FoCE2", battleIndex: 1, lightningVictoryTurns: 5 },
    { id: "FoCE3", battleIndex: 2, lightningVictoryTurns: null },
    { id: "FoCE4", battleIndex: 3, lightningVictoryTurns: 5 },
  ]

  it("counts beaten battles at their recorded or best result, not the frontier", () => {
    const overrides = withBattleProgress([], "FoCE2", lightning, {
      medals: 1,
      lightningVictory: false,
    })
    expect(trackMedalStats(battles, 2, overrides)).toEqual({
      medals: 4,
      maxMedals: 12,
      lightningVictories: 1,
      maxLightningVictories: 3,
    })
    expect(trackMedalStats(battles, undefined, [])).toMatchObject({
      medals: 0,
      lightningVictories: 0,
    })
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
  const eventBattle = (id: string, nodeNumber: number, type = "Standard") => ({
    id,
    campaignGroupId: "eventCampaign1",
    type,
    challenge: false,
    nodeNumber,
    battleIndex: nodeNumber - 1,
    lightningVictoryTurns: 5,
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
    eventBattle("AMS01", 1),
    eventBattle("AMS02", 2),
    eventBattle("AME01", 1, "Extremis"),
  ]
  const progress = (_groupId: string, type: string) =>
    type === "Standard"
      ? { completedBattleCount: 2, completedChallengeBattlesIds: [] }
      : undefined

  it("sums each beaten event track's unclaimed rewards and skips claimed battles", () => {
    const overrides = withBattleProgress([], "AMS02", event, {
      medals: 2,
      milestone: "Bronze",
    })
    expect(
      unclaimedEventRewardTracks(definitions, battles, progress, overrides)
    ).toEqual([
      {
        groupId: "eventCampaign1",
        type: "Standard",
        battleCount: 1,
        rewards: [
          { id: "shards_necroWarden", min: 5, max: 5 },
          { id: "xpCommon", min: 2, max: 2 },
          { id: "gold", min: 100, max: 100 },
        ],
      },
    ])
  })
})
