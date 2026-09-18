import { describe, expect, it } from "vitest"
import { battleIdSchema, campaignIdSchema } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

import {
  buildAttemptsLeftByBattle,
  buildBattleAttemptIndex,
  buildTodaysAttempts,
  calculateRealEnergyUsedToday,
  type RealBattleAttempt,
} from "./daily-raids-energy"

function battle(
  overrides: Omit<Partial<Battle>, "campaignGroupId"> & {
    campaignGroupId: string
  }
) {
  return {
    type: "Standard",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: 6,
    dailyAttempts: 10,
    ...overrides,
    campaignGroupId: campaignIdSchema.parse(overrides.campaignGroupId),
  } as Battle
}

function attempt(
  overrides: Omit<Partial<RealBattleAttempt>, "tacticusCampaignId"> & {
    tacticusCampaignId: string
  }
): RealBattleAttempt {
  return {
    type: "Standard",
    battleIndex: 0,
    attemptsUsed: 0,
    attemptsLeft: 10,
    ...overrides,
    tacticusCampaignId: campaignIdSchema.parse(overrides.tacticusCampaignId),
  }
}

describe("buildBattleAttemptIndex", () => {
  it("maps a standing campaign's battleIndex to its battleId", () => {
    const b1 = battleIdSchema.parse("B1")
    const b2 = battleIdSchema.parse("B2")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", nodeNumber: 1, battleIndex: 0 }),
      ],
      [
        b2,
        battle({ campaignGroupId: "campaign1", nodeNumber: 2, battleIndex: 1 }),
      ],
    ])

    const index = buildBattleAttemptIndex(battlesById)

    expect(index.get("campaign1:Standard:0")).toBe(b1)
    expect(index.get("campaign1:Standard:1")).toBe(b2)
  })

  it("indexes event-campaign battles too, keyed by type as well as battleIndex", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({
          campaignGroupId: "eventCampaign6",
          type: "Standard",
          nodeNumber: 1,
          battleIndex: 0,
        }),
      ],
    ])

    const index = buildBattleAttemptIndex(battlesById)

    expect(index.get("eventCampaign6:Standard:0")).toBe(eventBattle)
  })

  it("distinguishes a challenge node from the regular node it shares a nodeNumber with", () => {
    const regular = battleIdSchema.parse("AMS3")
    const challengeBattle = battleIdSchema.parse("AMSC3B")
    const battlesById = new Map([
      [
        regular,
        battle({
          campaignGroupId: "eventCampaign1",
          nodeNumber: 3,
          battleIndex: 2,
          challenge: false,
        }),
      ],
      [
        challengeBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          nodeNumber: 3,
          battleIndex: 3,
          challenge: true,
        }),
      ],
    ])

    const index = buildBattleAttemptIndex(battlesById)

    expect(index.get("eventCampaign1:Standard:2")).toBe(regular)
    expect(index.get("eventCampaign1:Standard:3")).toBe(challengeBattle)
  })

  it("indexes a campaign event's two tiers independently despite sharing a campaign group id", () => {
    const standardBattle = battleIdSchema.parse("AMS1")
    const extremisBattle = battleIdSchema.parse("AME1")
    const battlesById = new Map([
      [
        standardBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          type: "Standard",
          battleIndex: 0,
        }),
      ],
      [
        extremisBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          type: "Extremis",
          battleIndex: 0,
        }),
      ],
    ])

    const index = buildBattleAttemptIndex(battlesById)

    expect(index.get("eventCampaign1:Standard:0")).toBe(standardBattle)
    expect(index.get("eventCampaign1:Extremis:0")).toBe(extremisBattle)
  })
})

describe("calculateRealEnergyUsedToday", () => {
  it("returns 0 when there are no attempts today", () => {
    expect(calculateRealEnergyUsedToday([], new Map(), new Map())).toBe(0)
  })

  it("sums attemptsUsed * energyCost across standing-campaign attempts", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", battleIndex: 0, energyCost: 6 }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 3,
        }),
      ],
      battleAttemptIndex,
      battlesById
    )

    expect(total).toBe(18)
  })

  it("is not capped at any daily energy budget — can exceed it freely", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [
        b1,
        battle({
          campaignGroupId: "campaign1",
          battleIndex: 0,
          energyCost: 10,
        }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 50,
        }),
      ],
      battleAttemptIndex,
      battlesById
    )

    expect(total).toBe(500)
  })

  it("counts attempts at nodes unrelated to any specific goal, account-wide", () => {
    const b1 = battleIdSchema.parse("B1")
    const b2 = battleIdSchema.parse("B2")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", battleIndex: 0, energyCost: 6 }),
      ],
      [
        b2,
        battle({ campaignGroupId: "campaign2", battleIndex: 4, energyCost: 8 }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 1,
        }),
        attempt({
          tacticusCampaignId: "campaign2",
          battleIndex: 4,
          attemptsUsed: 1,
        }),
      ],
      battleAttemptIndex,
      battlesById
    )

    expect(total).toBe(14)
  })

  it("includes event-campaign attempts in the total, priced the same as standing attempts", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({
          campaignGroupId: "eventCampaign6",
          battleIndex: 0,
          energyCost: 10,
        }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 0,
          attemptsUsed: 5,
        }),
      ],
      battleAttemptIndex,
      battlesById
    )

    expect(total).toBe(50)
  })

  it("does not conflate a Standard-tier attempt with an Extremis-tier attempt at the same battleIndex", () => {
    const standardBattle = battleIdSchema.parse("AMS1")
    const extremisBattle = battleIdSchema.parse("AME1")
    const battlesById = new Map([
      [
        standardBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          type: "Standard",
          battleIndex: 0,
          energyCost: 6,
        }),
      ],
      [
        extremisBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          type: "Extremis",
          battleIndex: 0,
          energyCost: 10,
        }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "eventCampaign1",
          type: "Extremis",
          battleIndex: 0,
          attemptsUsed: 2,
        }),
      ],
      battleAttemptIndex,
      battlesById
    )

    expect(total).toBe(20)
  })

  it("skips zero/negative attempt entries and unmapped battleIndex values", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", battleIndex: 0, energyCost: 6 }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 0,
        }),
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 99,
          attemptsUsed: 4,
        }),
      ],
      battleAttemptIndex,
      battlesById
    )

    expect(total).toBe(0)
  })
})

describe("buildAttemptsLeftByBattle", () => {
  it("maps a standing-campaign attempt's attemptsLeft to its resolved battleId", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", battleIndex: 0 })],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const result = buildAttemptsLeftByBattle(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsLeft: 0,
        }),
      ],
      battleAttemptIndex
    )

    expect(result.get(b1)).toBe(0)
  })

  it("maps an event-campaign attempt's attemptsLeft the same way", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({ campaignGroupId: "eventCampaign6", battleIndex: 0 }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const result = buildAttemptsLeftByBattle(
      [
        attempt({
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 0,
          attemptsLeft: 0,
        }),
      ],
      battleAttemptIndex
    )

    expect(result.get(eventBattle)).toBe(0)
  })

  it("skips attempts whose key doesn't resolve to a known battle", () => {
    const result = buildAttemptsLeftByBattle(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 99,
          attemptsLeft: 0,
        }),
      ],
      new Map()
    )

    expect(result.size).toBe(0)
  })
})

describe("buildTodaysAttempts", () => {
  it("includes every attempt actually raided today, account-wide, standing or event-campaign", () => {
    const b1 = battleIdSchema.parse("B1")
    const b2 = battleIdSchema.parse("B2")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", battleIndex: 0 })],
      [b2, battle({ campaignGroupId: "eventCampaign6", battleIndex: 4 })],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const result = buildTodaysAttempts(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 3,
          attemptsLeft: 7,
        }),
        attempt({
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 4,
          attemptsUsed: 6,
          attemptsLeft: 0,
        }),
      ],
      battleAttemptIndex
    )

    expect(result).toEqual([
      { battleId: b1, attemptsUsed: 3, attemptsLeft: 7 },
      { battleId: b2, attemptsUsed: 6, attemptsLeft: 0 },
    ])
  })

  it("skips attempts that haven't actually been raided today", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", battleIndex: 0 })],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const result = buildTodaysAttempts(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 0,
        }),
      ],
      battleAttemptIndex
    )

    expect(result).toEqual([])
  })

  it("does not conflate a raided Standard-tier node with an unraided Extremis-tier node at the same battleIndex", () => {
    const standardBattle = battleIdSchema.parse("AMS1")
    const extremisBattle = battleIdSchema.parse("AME1")
    const battlesById = new Map([
      [
        standardBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          type: "Standard",
          battleIndex: 0,
        }),
      ],
      [
        extremisBattle,
        battle({
          campaignGroupId: "eventCampaign1",
          type: "Extremis",
          battleIndex: 0,
        }),
      ],
    ])
    const battleAttemptIndex = buildBattleAttemptIndex(battlesById)

    const result = buildTodaysAttempts(
      [
        attempt({
          tacticusCampaignId: "eventCampaign1",
          type: "Standard",
          battleIndex: 0,
          attemptsUsed: 6,
          attemptsLeft: 4,
        }),
      ],
      battleAttemptIndex
    )

    expect(result).toEqual([
      { battleId: standardBattle, attemptsUsed: 6, attemptsLeft: 4 },
    ])
  })
})
