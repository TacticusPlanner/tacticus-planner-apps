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
    type: "Standard",
    nodeNumber: 6,
    rewards: rewards(7, []),
  },
  {
    id: "I15",
    energyCost: 5,
    dailyAttempts: 10,
    campaignGroupId: "campaign1",
    type: "Standard",
    nodeNumber: 15,
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
  it("ignores Today's plan and uses the energy left today", () => {
    const result = plan({ realEnergyUsedToday: 40 })
    expect(result.battlesLeft).toBe(20)
    expect(result.energyBudget).toBe(60)
    expect(result.rows).toEqual([
      expect.objectContaining({ battleId: "I15", raids: 10 }),
    ])
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

  it("keeps only nodes with the requested deployment slots", () => {
    const result = plan({
      request: { battlesToGo: 2, eventOnly: false, slots: 5 },
      filterBattlesById: new Map([
        ["I06", filterBattle(null)],
        ["I15", { ...filterBattle("Standard"), slots: 4 }],
      ]),
      raidsFilters: { ...emptyRaidsFilters, slots: [4] },
    })
    expect(result.rows).toEqual([])
    expect(result.noDropRows).toEqual([
      expect.objectContaining({ battleId: "I06", raids: 2 }),
    ])
  })

  it("keeps only nodes where the requested alliance can deploy", () => {
    const result = plan({
      request: { battlesToGo: 2, eventOnly: false, alliance: "Xenos" },
      filterBattlesById: new Map([
        ["I06", { ...filterBattle(null), alliesAlliance: "Xenos" }],
        ["I15", filterBattle("Standard")],
      ]),
    })
    expect(result.rows).toEqual([])
    expect(result.noDropRows).toEqual([
      expect.objectContaining({ battleId: "I06", raids: 2 }),
    ])
  })

  it("lists nodes with the faction's enemies apart, until their enemies cover the kills", () => {
    const necrons = (nodeId: string, energyCost: number) => ({
      id: nodeId,
      energyCost,
      dailyAttempts: 10,
      campaignGroupId: "campaign1",
      type: "Standard",
      nodeNumber: 30,
      rewards: rewards(7, ["shards_necroWarden"]),
    })
    const result = plan({
      request: {
        battlesToGo: 2,
        eventOnly: false,
        enemyFaction: { faction: "Necrons", killsToGo: 12 },
      },
      availableBattles: [...battles, necrons("N01", 6), necrons("N02", 4)],
      filterBattlesById: new Map([
        ["I06", filterBattle(null)],
        ["I15", filterBattle("Standard")],
        ["N01", { ...filterBattle("Standard"), enemiesFactions: ["Necrons"] }],
        [
          "N02",
          {
            ...filterBattle("Standard"),
            enemiesFactions: ["Necrons", "Orks"],
            enemiesTotal: 4,
          },
        ],
      ]),
    })
    expect(result.rows.map((row) => [row.battleId, row.raids])).toEqual([
      ["N02", 2],
    ])
    // N02 is in the main list; N01 (5 enemies a raid) covers the 12 kills in 3 raids.
    expect(result.factionRows.map((row) => [row.battleId, row.raids])).toEqual([
      ["N01", 3],
    ])
  })

  it("puts faction nodes with the most enemies first, so the kills take the fewest raids", () => {
    const node = (nodeId: string, energyCost: number) => ({
      id: nodeId,
      energyCost,
      dailyAttempts: 10,
      campaignGroupId: "campaign1",
      type: "Standard",
      nodeNumber: 30,
      rewards: rewards(7, []),
    })
    const necrons = (enemiesTotal: number): RaidsFilterBattle => ({
      ...filterBattle("Standard"),
      enemiesFactions: ["Necrons"],
      enemiesTotal,
    })
    const result = plan({
      request: {
        battlesToGo: 0,
        eventOnly: false,
        enemyFaction: { faction: "Necrons", killsToGo: 20 },
      },
      availableBattles: [node("N03", 3), node("N09", 6)],
      filterBattlesById: new Map([
        ["N03", necrons(3)],
        ["N09", necrons(9)],
      ]),
    })
    // 9 enemies a raid at N09 first: 3 raids cover the 20 kills, before the cheaper N03.
    expect(result.factionRows.map((row) => [row.battleId, row.raids])).toEqual([
      ["N09", 3],
    ])
  })

  it("keeps faction nodes to lightning-condition nodes while lightning victories are open", () => {
    const indomitus = (nodeNumber: number) => ({
      id: `I${nodeNumber}`,
      energyCost: 5,
      dailyAttempts: 10,
      campaignGroupId: "campaign1",
      type: "Standard",
      nodeNumber,
      rewards: rewards(7, []),
    })
    const necrons: RaidsFilterBattle = {
      ...filterBattle("Standard"),
      enemiesFactions: ["Necrons"],
      enemiesTotal: 5,
    }
    const result = plan({
      request: {
        battlesToGo: 0,
        eventOnly: true,
        enemyFaction: { faction: "Necrons", killsToGo: 10 },
      },
      availableBattles: [indomitus(18), indomitus(19)],
      filterBattlesById: new Map([
        ["I18", necrons],
        ["I19", necrons],
      ]),
    })
    // Indomitus 18 has no lightning condition, so a raid there would not count as both.
    expect(result.factionRows.map((row) => row.battleId)).toEqual(["I19"])
  })

  it("has no faction list without a faction-kill objective", () => {
    expect(plan().factionRows).toEqual([])
  })
})
