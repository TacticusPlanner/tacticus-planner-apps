import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"
import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { flattenTodayLocations } from "./flatten-today-locations"

function entry(overrides: Partial<RaidBreakdownEntry>): RaidBreakdownEntry {
  return {
    goalId: "goal-a",
    resourceId: "upgrade-1" as RaidBreakdownEntry["resourceId"],
    battleId: "node-1" as BattleId,
    raidsPerformed: 1,
    itemsFarmed: 1,
    energySpent: 6,
    dailyAttempts: 5,
    ...overrides,
  }
}

describe("flattenTodayLocations", () => {
  it("merges two goals raiding the same node into one row summing raid counts", () => {
    const entries = [
      entry({
        goalId: "goal-a",
        battleId: "indomitus-elite-3" as BattleId,
        raidsPerformed: 2,
      }),
      entry({
        goalId: "goal-b",
        battleId: "indomitus-elite-3" as BattleId,
        raidsPerformed: 3,
      }),
    ]

    const result = flattenTodayLocations(entries, new Map())

    expect(result).toEqual([
      {
        battleId: "indomitus-elite-3",
        resourceId: "upgrade-1",
        raidsToPerform: 5,
        dailyAttempts: 5,
      },
    ])
  })

  it("leaves a single goal's location unchanged", () => {
    const entries = [
      entry({ battleId: "node-1" as BattleId, raidsPerformed: 4 }),
    ]

    const result = flattenTodayLocations(entries, new Map())

    expect(result).toEqual([
      {
        battleId: "node-1",
        resourceId: "upgrade-1",
        raidsToPerform: 4,
        dailyAttempts: 5,
      },
    ])
  })

  it("drops a location whose real synced attempts today are exhausted", () => {
    const entries = [
      entry({ battleId: "node-1" as BattleId, raidsPerformed: 2 }),
    ]
    const attemptsLeftByBattle = new Map<BattleId, number>([
      ["node-1" as BattleId, 0],
    ])

    const result = flattenTodayLocations(entries, attemptsLeftByBattle)

    expect(result).toEqual([])
  })

  it("keeps a location with unknown real-attempts data (treated as not exhausted)", () => {
    const entries = [
      entry({ battleId: "node-1" as BattleId, raidsPerformed: 2 }),
    ]

    const result = flattenTodayLocations(entries, new Map())

    expect(result).toHaveLength(1)
  })

  it("skips a zero-raid entry", () => {
    const entries = [
      entry({ battleId: "node-1" as BattleId, raidsPerformed: 0 }),
    ]

    const result = flattenTodayLocations(entries, new Map())

    expect(result).toEqual([])
  })
})
