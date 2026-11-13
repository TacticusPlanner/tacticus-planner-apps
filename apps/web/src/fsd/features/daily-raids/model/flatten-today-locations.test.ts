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
    remainingBefore: 1,
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
        remainingBefore: 2,
        materialNeed: 2,
        dropRate: 0.5,
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
        remainingBefore: 1,
        materialNeed: 1,
        dropRate: 0.25,
      },
    ])
  })

  it("counts a goal's whole need at a later node, not what is left after earlier nodes", () => {
    // Needs 3: the first node is raided out (expected 1.2 drops), so the second node sees 1.8 left.
    const entries = [
      entry({
        battleId: "node-1" as BattleId,
        raidsPerformed: 3,
        dailyAttempts: 3,
        itemsFarmed: 1.2,
        remainingBefore: 3,
      }),
      entry({
        battleId: "node-2" as BattleId,
        raidsPerformed: 3,
        dailyAttempts: 5,
        itemsFarmed: 1.8,
        remainingBefore: 1.8,
      }),
    ]

    const result = flattenTodayLocations(entries, new Map())

    expect(result.map((row) => row.materialNeed)).toEqual([3, 3])
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
