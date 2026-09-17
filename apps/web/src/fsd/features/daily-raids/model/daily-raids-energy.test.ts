import { describe, expect, it } from "vitest"
import { battleIdSchema, campaignIdSchema } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

import {
  buildAttemptsLeftByBattle,
  buildStandingBattleIndex,
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
    battleIndex: 0,
    attemptsUsed: 0,
    attemptsLeft: 10,
    ...overrides,
    tacticusCampaignId: campaignIdSchema.parse(overrides.tacticusCampaignId),
  }
}

describe("buildStandingBattleIndex", () => {
  it("maps standing campaigns' nodeNumber-1 to their battleId, keyed by battleIndex", () => {
    const b1 = battleIdSchema.parse("B1")
    const b2 = battleIdSchema.parse("B2")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", nodeNumber: 1 })],
      [b2, battle({ campaignGroupId: "campaign1", nodeNumber: 2 })],
    ])

    const index = buildStandingBattleIndex(battlesById, new Set())

    expect(index.get("campaign1:0")).toBe(b1)
    expect(index.get("campaign1:1")).toBe(b2)
  })

  it("excludes event campaigns from the index entirely", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({ campaignGroupId: "eventCampaign6", nodeNumber: 1 }),
      ],
    ])

    const index = buildStandingBattleIndex(
      battlesById,
      new Set(["eventCampaign6"])
    )

    expect(index.size).toBe(0)
  })
})

describe("calculateRealEnergyUsedToday", () => {
  it("returns 0 when there are no attempts today", () => {
    expect(
      calculateRealEnergyUsedToday([], new Set(), new Map(), new Map())
    ).toBe(0)
  })

  it("sums attemptsUsed * energyCost across standing-campaign attempts", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", nodeNumber: 1, energyCost: 6 }),
      ],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 3,
        }),
      ],
      new Set(),
      standingBattleIndex,
      battlesById
    )

    expect(total).toBe(18)
  })

  it("is not capped at any daily energy budget — can exceed it freely", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", nodeNumber: 1, energyCost: 10 }),
      ],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 50,
        }),
      ],
      new Set(),
      standingBattleIndex,
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
        battle({ campaignGroupId: "campaign1", nodeNumber: 1, energyCost: 6 }),
      ],
      [
        b2,
        battle({ campaignGroupId: "campaign2", nodeNumber: 5, energyCost: 8 }),
      ],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

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
      new Set(),
      standingBattleIndex,
      battlesById
    )

    expect(total).toBe(14)
  })

  it("excludes event-campaign attempts from the total", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({ campaignGroupId: "eventCampaign6", nodeNumber: 1 }),
      ],
    ])
    const eventCampaignIds = new Set(["eventCampaign6"])
    const standingBattleIndex = buildStandingBattleIndex(
      battlesById,
      eventCampaignIds
    )

    const total = calculateRealEnergyUsedToday(
      [
        attempt({
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 0,
          attemptsUsed: 5,
        }),
      ],
      eventCampaignIds,
      standingBattleIndex,
      battlesById
    )

    expect(total).toBe(0)
  })

  it("skips zero/negative attempt entries and unmapped battleIndex values", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [
        b1,
        battle({ campaignGroupId: "campaign1", nodeNumber: 1, energyCost: 6 }),
      ],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

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
      new Set(),
      standingBattleIndex,
      battlesById
    )

    expect(total).toBe(0)
  })
})

describe("buildAttemptsLeftByBattle", () => {
  it("maps a standing-campaign attempt's attemptsLeft to its resolved battleId", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", nodeNumber: 1 })],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

    const result = buildAttemptsLeftByBattle(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsLeft: 0,
        }),
      ],
      new Set(),
      standingBattleIndex
    )

    expect(result.get(b1)).toBe(0)
  })

  it("excludes event-campaign attempts entirely", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({ campaignGroupId: "eventCampaign6", nodeNumber: 1 }),
      ],
    ])
    const eventCampaignIds = new Set(["eventCampaign6"])
    const standingBattleIndex = buildStandingBattleIndex(
      battlesById,
      eventCampaignIds
    )

    const result = buildAttemptsLeftByBattle(
      [
        attempt({
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 0,
          attemptsLeft: 0,
        }),
      ],
      eventCampaignIds,
      standingBattleIndex
    )

    expect(result.size).toBe(0)
  })

  it("skips attempts whose battleIndex doesn't resolve to a known battle", () => {
    const result = buildAttemptsLeftByBattle(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 99,
          attemptsLeft: 0,
        }),
      ],
      new Set(),
      new Map()
    )

    expect(result.size).toBe(0)
  })
})

describe("buildTodaysAttempts", () => {
  it("includes every standing-campaign attempt actually raided today, account-wide", () => {
    const b1 = battleIdSchema.parse("B1")
    const b2 = battleIdSchema.parse("B2")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", nodeNumber: 1 })],
      [b2, battle({ campaignGroupId: "campaign2", nodeNumber: 5 })],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

    const result = buildTodaysAttempts(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 3,
          attemptsLeft: 7,
        }),
        attempt({
          tacticusCampaignId: "campaign2",
          battleIndex: 4,
          attemptsUsed: 10,
          attemptsLeft: 0,
        }),
      ],
      new Set(),
      standingBattleIndex
    )

    expect(result).toEqual([
      { battleId: b1, attemptsUsed: 3, attemptsLeft: 7 },
      { battleId: b2, attemptsUsed: 10, attemptsLeft: 0 },
    ])
  })

  it("skips attempts that haven't actually been raided today", () => {
    const b1 = battleIdSchema.parse("B1")
    const battlesById = new Map([
      [b1, battle({ campaignGroupId: "campaign1", nodeNumber: 1 })],
    ])
    const standingBattleIndex = buildStandingBattleIndex(battlesById, new Set())

    const result = buildTodaysAttempts(
      [
        attempt({
          tacticusCampaignId: "campaign1",
          battleIndex: 0,
          attemptsUsed: 0,
        }),
      ],
      new Set(),
      standingBattleIndex
    )

    expect(result).toEqual([])
  })

  it("excludes event-campaign attempts entirely", () => {
    const eventBattle = battleIdSchema.parse("EB1")
    const battlesById = new Map([
      [
        eventBattle,
        battle({ campaignGroupId: "eventCampaign6", nodeNumber: 1 }),
      ],
    ])
    const eventCampaignIds = new Set(["eventCampaign6"])
    const standingBattleIndex = buildStandingBattleIndex(
      battlesById,
      eventCampaignIds
    )

    const result = buildTodaysAttempts(
      [
        attempt({
          tacticusCampaignId: "eventCampaign6",
          battleIndex: 0,
          attemptsUsed: 5,
        }),
      ],
      eventCampaignIds,
      standingBattleIndex
    )

    expect(result).toEqual([])
  })
})
