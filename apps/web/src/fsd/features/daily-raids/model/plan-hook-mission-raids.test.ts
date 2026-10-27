import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import type { DailyRaidsCalculationViewModel } from "./daily-raids.domain"
import type { MissionRaidsRequest } from "./mission-raids"
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
    lightningVictoryTurns: null,
    rewards: rewards(7, []),
  },
  {
    id: "I15",
    energyCost: 5,
    dailyAttempts: 10,
    campaignGroupId: "campaign1",
    type: "Standard",
    nodeNumber: 15,
    lightningVictoryTurns: null,
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

  it("puts nodes earning more of a running HSE's points first among nodes of equal cost", () => {
    const node = (nodeId: string, nodeNumber: number) => ({
      id: nodeId,
      energyCost: 5,
      dailyAttempts: 1,
      campaignGroupId: "campaign1",
      type: "Standard",
      nodeNumber,
      lightningVictoryTurns: nodeNumber >= 19 ? 4 : null,
      rewards: rewards(12, ["shards_necroWarden"]),
    })
    const result = plan({
      calculation: null,
      request: { battlesToGo: 2, eventOnly: false },
      availableBattles: [node("I20", 20), node("I21", 21), node("I22", 22)],
      filterBattlesById: new Map([
        ["I20", filterBattle("Standard")],
        ["I21", filterBattle("Standard")],
        ["I22", filterBattle("Standard")],
      ]),
      eventPointsByBattleId: new Map([
        [id("I21"), 9],
        [id("I22"), 15],
      ]),
    })
    expect(result.rows.map((row) => [row.battleId, row.eventPoints])).toEqual([
      ["I22", 15],
      ["I21", 9],
    ])
  })

  it("never trades energy for HSE points", () => {
    const node = (nodeId: string, energyCost: number) => ({
      id: nodeId,
      energyCost,
      dailyAttempts: 1,
      campaignGroupId: "campaign1",
      type: "Standard",
      nodeNumber: 20,
      lightningVictoryTurns: 4,
      rewards: rewards(12, ["shards_necroWarden"]),
    })
    const result = plan({
      calculation: null,
      request: { battlesToGo: 1, eventOnly: false },
      availableBattles: [node("I20", 3), node("I21", 5)],
      filterBattlesById: new Map([
        ["I20", filterBattle("Standard")],
        ["I21", filterBattle("Standard")],
      ]),
      eventPointsByBattleId: new Map([[id("I21"), 15]]),
    })
    expect(result.rows).toEqual([
      expect.objectContaining({ battleId: "I20", eventPoints: 0 }),
    ])
  })

  it("puts nodes worth more HRE points first among equal costs: a lightning condition, then enemy power", () => {
    const node = (nodeId: string, nodeNumber: number, enemyPower: number) => ({
      id: nodeId,
      energyCost: 5,
      dailyAttempts: 1,
      campaignGroupId: "campaign1",
      type: "Standard",
      nodeNumber,
      // As served: Indomitus nodes below 19 have no lightning victory.
      lightningVictoryTurns: nodeNumber >= 19 ? 4 : null,
      enemyPower,
      rewards: rewards(12, ["shards_necroWarden"]),
    })
    const result = plan({
      calculation: null,
      request: { battlesToGo: 3, eventOnly: false },
      // Indomitus 18 has no lightning condition, so it comes last despite its power.
      availableBattles: [
        node("I18", 18, 900),
        node("I19", 19, 100),
        node("I20", 20, 300),
      ],
      filterBattlesById: new Map([
        ["I18", filterBattle("Standard")],
        ["I19", filterBattle("Standard")],
        ["I20", filterBattle("Standard")],
      ]),
    })
    expect(result.rows.map((row) => row.battleId)).toEqual([
      "I20",
      "I19",
      "I18",
    ])
  })
})

const node = (
  nodeId: string,
  energyCost: number,
  nodeNumber = 30,
  dailyAttempts = 10
) => ({
  id: nodeId,
  energyCost,
  dailyAttempts,
  campaignGroupId: "campaign1",
  type: "Standard",
  nodeNumber,
  lightningVictoryTurns: nodeNumber >= 19 ? 4 : null,
  rewards: rewards(7, ["shards_necroWarden"]),
})
const manual = (
  overrides: Partial<NonNullable<MissionRaidsRequest["manual"]>> = {}
): NonNullable<MissionRaidsRequest["manual"]> => ({
  needs: [{ toGo: 10, per: "enemies" }],
  preferLightning: false,
  countsAsRaids: false,
  ...overrides,
})
const stats = (health: number, byFaction: Record<string, number> = {}) => ({
  health,
  byFaction: new Map(Object.entries(byFaction)),
})

describe("planHookMissionRaids: battles fought by hand", () => {
  it("keeps the battles to the requested slots and alliance, but never the raids", () => {
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 2,
        eventOnly: false,
        manual: manual({
          needs: [{ toGo: 5, per: "abilityUses" }],
          slots: 5,
          alliance: "Xenos",
        }),
      },
      availableBattles: [node("X5", 5), node("X4", 4), node("I5", 5)],
      filterBattlesById: new Map([
        ["X5", { ...filterBattle("Standard"), alliesAlliance: "Xenos" }],
        [
          "X4",
          { ...filterBattle("Standard"), alliesAlliance: "Xenos", slots: 4 },
        ],
        ["I5", filterBattle("Standard")],
      ]),
    })
    expect(
      result.battles?.rows.map((row) => [row.battleId, row.raids])
    ).toEqual([["X5", 1]])
    // The raids take the cheapest node, wherever it is and whatever its slots.
    expect(result.rows.map((row) => [row.battleId, row.raids])).toEqual([
      ["X4", 2],
    ])
  })

  it("puts a node that feeds a goal first and carries each node's deployment rules", () => {
    const result = plan({
      calculation: {
        today: { entries: [] },
        missionGoalNodes: new Map([
          [
            id("G6"),
            { priority: 1, goalIds: ["g1"], resourceId: "shards_necroWarden" },
          ],
        ]),
      } as unknown as DailyRaidsCalculationViewModel,
      request: {
        battlesToGo: 0,
        eventOnly: false,
        manual: manual({ needs: [{ toGo: 1, per: "battle" }] }),
      },
      availableBattles: [
        { ...node("C3", 3), alliesFactions: ["Orks"], slots: 4 },
        { ...node("G6", 6), alliesFactions: ["Ultramarines"], slots: 5 },
      ],
      filterBattlesById: new Map([
        ["C3", filterBattle("Standard")],
        ["G6", filterBattle("Standard")],
      ]),
    })
    expect(result.battles?.rows).toEqual([
      expect.objectContaining({
        battleId: "G6",
        raids: 1,
        deploy: { factions: ["Ultramarines"], slots: 5 },
      }),
    ])
  })

  it("counts each faction's own enemies, most per energy first, so the kills take the fewest battles", () => {
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 0,
        eventOnly: false,
        manual: manual({
          needs: [{ toGo: 20, per: "factionEnemies" }],
          faction: "Necrons",
        }),
      },
      availableBattles: [node("N03", 3), node("N09", 6), node("O10", 3)],
      filterBattlesById: new Map([
        ["N03", { ...filterBattle("Standard"), enemiesFactions: ["Necrons"] }],
        ["N09", { ...filterBattle("Standard"), enemiesFactions: ["Necrons"] }],
        ["O10", { ...filterBattle("Standard"), enemiesFactions: ["Orks"] }],
      ]),
      enemyStatsByBattleId: new Map([
        [id("N03"), stats(1000, { Necrons: 3 })],
        [id("N09"), stats(1000, { Necrons: 9, Orks: 2 })],
        [id("O10"), stats(1000, { Orks: 10 })],
      ]),
    })
    // 9 Necrons for 6 energy (1.5 a point) before 3 for 3 (1 a point): 3 battles cover 20 kills.
    expect(
      result.battles?.rows.map((row) => [row.battleId, row.raids])
    ).toEqual([["N09", 3]])
    expect(result.battles?.moreNeeded).toBe(false)
  })

  it("puts lightning-condition nodes first while lightning victories are open", () => {
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 0,
        eventOnly: true,
        manual: manual({ preferLightning: true }),
      },
      availableBattles: [node("I18", 3, 18), node("I19", 5, 19)],
      filterBattlesById: new Map([
        ["I18", filterBattle("Standard")],
        ["I19", filterBattle("Standard")],
      ]),
    })
    expect(result.battles?.rows.map((row) => row.battleId)).toEqual(["I19"])
  })

  it("keeps lightning-condition nodes ahead of goal nodes while lightning victories are open", () => {
    const result = plan({
      calculation: {
        today: { entries: [] },
        missionGoalNodes: new Map([
          [
            id("I18"),
            { priority: 1, goalIds: ["g1"], resourceId: "shards_necroWarden" },
          ],
        ]),
      } as unknown as DailyRaidsCalculationViewModel,
      request: {
        battlesToGo: 0,
        eventOnly: true,
        manual: manual({ preferLightning: true }),
      },
      availableBattles: [node("I18", 3, 18), node("I19", 5, 19)],
      filterBattlesById: new Map([
        ["I18", filterBattle("Standard")],
        ["I19", filterBattle("Standard")],
      ]),
    })
    expect(result.battles?.rows.map((row) => row.battleId)).toEqual(["I19"])
  })

  it("keeps featured-hero battles to nodes where the hero's faction deploys, a full team where slots are unknown", () => {
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 0,
        eventOnly: false,
        manual: manual({
          needs: [{ toGo: 2, per: "battle" }],
          heroFaction: "Orks",
        }),
      },
      availableBattles: [
        { ...node("U3", 3), alliesFactions: ["Ultramarines"], slots: 5 },
        { ...node("O5", 5), alliesFactions: ["Orks", "Necrons"], slots: 0 },
      ],
      filterBattlesById: new Map([
        [
          "U3",
          { ...filterBattle("Standard"), alliesFactions: ["Ultramarines"] },
        ],
        [
          "O5",
          { ...filterBattle("Standard"), alliesFactions: ["Orks", "Necrons"] },
        ],
      ]),
    })
    expect(result.battles?.rows).toEqual([
      expect.objectContaining({
        battleId: "O5",
        deploy: { factions: ["Orks", "Necrons"], slots: 5 },
      }),
    ])
  })

  it("takes campaign wins won by hand off the raids, sharing the node's attempts and today's energy", () => {
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 10,
        eventOnly: false,
        manual: manual({
          needs: [{ toGo: 4, per: "battle" }],
          countsAsRaids: true,
        }),
      },
      availableBattles: [node("A", 3, 30, 5)],
      filterBattlesById: new Map([["A", filterBattle("Standard")]]),
      dailyEnergy: 60,
    })
    expect(
      result.battles?.rows.map((row) => [row.battleId, row.raids])
    ).toEqual([["A", 4]])
    expect(result.battlesLeft).toBe(6)
    // 1 attempt left at A after the 4 battles.
    expect(result.rows.map((row) => [row.battleId, row.raids])).toEqual([
      ["A", 1],
    ])
  })

  it("fills until every estimated objective is covered", () => {
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 0,
        eventOnly: false,
        manual: manual({
          needs: [
            { toGo: 10, per: "enemies" },
            { toGo: 20, per: "abilityUses" },
          ],
        }),
      },
      availableBattles: [node("A", 3)],
      filterBattlesById: new Map([["A", filterBattle("Standard")]]),
    })
    // 5 enemies a battle covers the kills in 2, but the 20 ability uses need 4.
    expect(
      result.battles?.rows.map((row) => [row.battleId, row.raids])
    ).toEqual([["A", 4]])
  })

  it("lists the best few nodes open-ended when no objective has an estimate", () => {
    const nodes = ["A", "B", "C", "D"]
    const result = plan({
      calculation: null,
      request: {
        battlesToGo: 0,
        eventOnly: false,
        manual: manual({ needs: [{ toGo: 5000, per: null }] }),
      },
      availableBattles: nodes.map((nodeId) => node(nodeId, 5)),
      filterBattlesById: new Map(
        nodes.map((nodeId) => [nodeId, filterBattle("Standard")])
      ),
      enemyStatsByBattleId: new Map([
        [id("A"), stats(100)],
        [id("B"), stats(400)],
        [id("C"), stats(300)],
        [id("D"), stats(200)],
      ]),
    })
    expect(result.battles).toMatchObject({ openEnded: true, totalEnergy: 0 })
    expect(result.battles?.rows.map((row) => row.battleId)).toEqual([
      "B",
      "C",
      "D",
    ])
  })

  it("has no battles without a manual objective", () => {
    expect(plan().battles).toBeNull()
  })
})
