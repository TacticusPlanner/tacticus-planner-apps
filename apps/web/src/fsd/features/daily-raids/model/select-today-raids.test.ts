import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"
import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { selectTodayRaids, type TodayRaidsInput } from "./select-today-raids"

function entry(overrides: Partial<RaidBreakdownEntry>): RaidBreakdownEntry {
  return {
    goalId: "goal-a",
    resourceId: "upgrade-1" as RaidBreakdownEntry["resourceId"],
    battleId: "node-1" as BattleId,
    raidsPerformed: 2,
    itemsFarmed: 2,
    energySpent: 12,
    dailyAttempts: 5,
    ...overrides,
  }
}

const planNode = "plan-node" as BattleId
const bonusNode = "bonus-node" as BattleId
const today = [entry({ battleId: planNode })]
const bonus = [entry({ battleId: bonusNode, resourceId: "bonus-1" as never })]

function input(overrides: Partial<TodayRaidsInput> = {}): TodayRaidsInput {
  return {
    todayEntries: today,
    bonusEntries: bonus,
    attemptsLeftByBattle: new Map(),
    dailyEnergy: 288,
    realEnergyUsedToday: 120,
    ...overrides,
  }
}

describe("selectTodayRaids", () => {
  it("keeps the plan and a separate bonus list below the daily energy limit", () => {
    expect(selectTodayRaids(input())).toEqual({
      planEntries: today,
      bonusEntries: bonus,
      energyLimitReached: false,
    })
  })

  it("keeps the plan one energy short of the limit", () => {
    const result = selectTodayRaids(input({ realEnergyUsedToday: 287 }))

    expect(result.energyLimitReached).toBe(false)
    expect(result.planEntries).toEqual(today)
  })

  it("drops the plan so Bonus Raids are the only list once the limit is reached", () => {
    expect(selectTodayRaids(input({ realEnergyUsedToday: 288 }))).toEqual({
      planEntries: [],
      bonusEntries: bonus,
      energyLimitReached: true,
    })
  })

  it("treats spend above the limit as reached", () => {
    const result = selectTodayRaids(input({ realEnergyUsedToday: 400 }))

    expect(result.energyLimitReached).toBe(true)
    expect(result.planEntries).toEqual([])
  })

  it("leaves the plan unchanged when nothing has been synced (zero spend)", () => {
    const result = selectTodayRaids(input({ realEnergyUsedToday: 0 }))

    expect(result.energyLimitReached).toBe(false)
    expect(result.planEntries).toEqual(today)
  })

  it("treats a daily energy limit of zero as no limit", () => {
    const result = selectTodayRaids(
      input({ dailyEnergy: 0, realEnergyUsedToday: 0 })
    )

    expect(result.energyLimitReached).toBe(false)
  })

  it("drops bonus raids whose node is exhausted", () => {
    const spent = entry({ battleId: "spent" as BattleId })
    const result = selectTodayRaids(
      input({
        bonusEntries: [spent, ...bonus],
        attemptsLeftByBattle: new Map([["spent" as BattleId, 0]]),
        realEnergyUsedToday: 300,
      })
    )

    expect(result.bonusEntries).toEqual(bonus)
  })
})
