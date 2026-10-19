import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import type { DailyRaidsCalculationViewModel } from "./daily-raids.domain"
import { planHookMissionRaids } from "./plan-hook-mission-raids"
import {
  emptyRaidsFilters,
  type RaidsFilterBattle,
} from "./raids-filters/raids-filters.domain"

const id = (value: string) => value as BattleId

const rewards = (gold: number, drops: string[]) => ({
  guaranteed: [{ id: "gold", min: gold, max: gold }],
  potential: drops.map((drop) => ({ id: drop, effectiveRate: 0.2 })),
})
const battles = [
  {
    id: "I06",
    energyCost: 3,
    dailyAttempts: 3,
    campaignGroupId: "campaign1",
    rewards: rewards(7, []),
  },
  {
    id: "I15",
    energyCost: 5,
    dailyAttempts: 10,
    campaignGroupId: "campaign1",
    rewards: rewards(12, ["shards_necroWarden"]),
  },
]

const filterBattle = (
  campaignType: RaidsFilterBattle["campaignType"]
): RaidsFilterBattle => ({
  slots: 5,
  alliesAlliance: "Imperial",
  alliesFactions: [],
  enemiesAlliances: [],
  enemiesFactions: [],
  enemiesTraits: [],
  enemiesTotal: 5,
  enemiesTypes: [],
  campaignType,
})

// Today still plans 10 raids at I15.
const calculation = {
  today: { entries: [{ battleId: id("I15"), raidsPerformed: 10 }] },
  missionGoalNodes: new Map(),
} as unknown as DailyRaidsCalculationViewModel

const plan = (
  overrides: Partial<Parameters<typeof planHookMissionRaids>[0]> = {}
) =>
  planHookMissionRaids({
    request: { battlesToGo: 20, eventOnly: false },
    calculation,
    availableBattles: battles,
    campaignDefinitions: [],
    allBattlesById: new Map(battles.map((battle) => [id(battle.id), battle])),
    attemptsLeftByBattle: new Map(),
    dailyEnergy: 100,
    realEnergyUsedToday: 0,
    filterBattlesById: new Map([
      ["I06", filterBattle(null)],
      ["I15", filterBattle("Standard")],
    ]),
    raidsFilters: emptyRaidsFilters,
    ...overrides,
  })

describe("planHookMissionRaids", () => {
  it("counts Today's remaining plan first", () => {
    expect(plan().plannedCount).toBe(10)
  })

  it("drops Today's plan once the daily energy limit is reached", () => {
    const result = plan({ realEnergyUsedToday: 100 })
    expect(result.plannedCount).toBe(0)
    expect(result.battlesLeft).toBe(20)
    expect(result.empty).toBe("no-energy")
  })

  it("splits the no-drop nodes from the nodes that drop something", () => {
    const result = plan({ calculation: null })
    expect(result.rows.map((row) => row.battleId)).toEqual(["I15"])
    expect(result.noDropRows.map((row) => row.battleId)).toEqual(["I06"])
  })

  it("ignores the campaign-type Raids Filter", () => {
    const result = plan({
      calculation: null,
      raidsFilters: { ...emptyRaidsFilters, campaignTypes: ["Elite"] },
    })
    expect(result.outlookNodes).toHaveLength(2)
    expect(result.rows.map((row) => row.battleId)).toEqual(["I15"])
  })

  it("keeps the other Raids Filters", () => {
    const result = plan({
      raidsFilters: { ...emptyRaidsFilters, enemiesTypes: ["Ork Boy"] },
    })
    expect(result.empty).toBe("filtered")
  })
})
