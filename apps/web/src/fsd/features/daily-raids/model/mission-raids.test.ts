import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import {
  planMissionRaids,
  remainingPlannedRaids,
  type MissionGoalNode,
  type MissionRaidBattle,
  type PlanMissionRaidsInput,
} from "./mission-raids"

const id = (value: string) => value as BattleId

const node = (
  battleId: string,
  energyCost: number,
  dailyAttempts: number,
  options: {
    isEvent?: boolean
    expectedGold?: number
    drops?: [string, number][]
  } = {}
): MissionRaidBattle => ({
  id: id(battleId),
  energyCost,
  dailyAttempts,
  isEvent: options.isEvent ?? false,
  expectedGold: options.expectedGold ?? 12.5,
  dropRates: new Map(options.drops ?? [[`drop${battleId}`, 0.2]]),
})

const goal = (resourceId: string, priority = 1): MissionGoalNode => ({
  priority,
  goalIds: [`g${priority}`],
  resourceId: resourceId as never,
})

// Indomitus I06-I14 cost 3 with a cap of 3 and drop nothing; I15-I29 cost 5 with a cap of 10.
const noDrop = Array.from({ length: 9 }, (_, index) =>
  node(`I${String(index + 6).padStart(2, "0")}`, 3, 3, {
    expectedGold: 7.5,
    drops: [],
  })
)
const fives = Array.from({ length: 15 }, (_, index) =>
  node(`I${index + 15}`, 5, 10)
)
const indomitus = [...noDrop, ...fives]

const base = (
  overrides: Partial<PlanMissionRaidsInput> = {}
): PlanMissionRaidsInput => ({
  battlesToGo: 63,
  eventOnly: false,
  battles: indomitus,
  attemptsLeftByBattle: new Map(),
  plannedByBattle: new Map(),
  dailyEnergy: 538,
  realEnergyUsedToday: 0,
  goalNodesByBattle: new Map(),
  passesFilter: () => true,
  ...overrides,
})

// Today still plans 25 raids at a 6-energy node (150 energy).
const withToday = (overrides: Partial<PlanMissionRaidsInput> = {}) =>
  base({
    battles: [
      ...indomitus,
      node("SH01", 6, 10),
      node("SH02", 6, 10),
      node("SH03", 6, 10),
    ],
    plannedByBattle: new Map([
      [id("SH01"), 10],
      [id("SH02"), 10],
      [id("SH03"), 5],
    ]),
    realEnergyUsedToday: 200,
    ...overrides,
  })

const raidsOf = (rows: readonly { battleId: string; raids: number }[]) =>
  Object.fromEntries(rows.map((row) => [row.battleId, row.raids]))

describe("planMissionRaids", () => {
  it("counts Today's plan first and reserves its energy", () => {
    const plan = planMissionRaids(withToday())
    expect(plan.plannedCount).toBe(25)
    expect(plan.battlesLeft).toBe(38)
    expect(plan.energyBudget).toBe(538 - 200 - 150)
  })

  it("fills the nodes that drop something, cheapest first", () => {
    const plan = planMissionRaids(withToday())
    expect(raidsOf(plan.rows)).toEqual({ I15: 10, I16: 10, I17: 10, I18: 7 })
    expect(plan.totalRaids).toBe(37)
    expect(plan.totalEnergy).toBe(185)
    expect(plan.remainingAfter).toBe(1)
  })

  it("fills the no-drop Indomitus nodes on their own, as an alternative", () => {
    const plan = planMissionRaids(withToday())
    expect(plan.noDropRows.map((row) => row.battleId)).toEqual(
      noDrop.map((battle) => battle.id)
    )
    expect(plan.noDropRows.every((row) => row.raids === 3)).toBe(true)
  })

  it("says Today's plan completes the objective", () => {
    const plan = planMissionRaids(withToday({ battlesToGo: 20 }))
    expect(plan.rows).toEqual([])
    expect(plan.noDropRows).toEqual([])
    expect(plan.empty).toBe("plan-completes")
  })

  it("suggests nothing when planned energy uses the whole budget", () => {
    const plan = planMissionRaids(
      withToday({ realEnergyUsedToday: 300, dailyEnergy: 450 })
    )
    expect(plan.energyBudget).toBe(0)
    expect(plan.empty).toBe("no-energy")
    expect(plan.plannedCount).toBe(25)
  })

  it("says attempts ran out when energy is still left", () => {
    const plan = planMissionRaids(
      base({
        attemptsLeftByBattle: new Map(
          indomitus.map((battle) => [battle.id, 0])
        ),
      })
    )
    expect(plan.energyBudget).toBe(538)
    expect(plan.rows).toEqual([])
    expect(plan.empty).toBe("no-attempts")
  })

  it("leaves a node's attempts to Today's plan and synced usage", () => {
    const plan = planMissionRaids(
      base({
        battles: [node("I30", 6, 10)],
        battlesToGo: 50,
        attemptsLeftByBattle: new Map([[id("I30"), 6]]),
        plannedByBattle: new Map([[id("I30"), 3]]),
      })
    )
    expect(plan.rows[0]?.raids).toBe(3)
  })

  it("puts goal drops first, by drop rate, then by gold", () => {
    const plan = planMissionRaids(
      base({
        battles: [
          node("FoCM04", 6, 10, {
            expectedGold: 53,
            drops: [["upgDmgU019", 0.15]],
          }),
          node("IM37", 6, 10, {
            expectedGold: 65,
            drops: [["upgDmgU019", 0.15]],
          }),
          node("FoCM71", 6, 10, {
            expectedGold: 77,
            drops: [["upgHpL103", 0.01]],
          }),
          node("FoCM09", 6, 10, {
            expectedGold: 53,
            drops: [["upgArmC003", 0.2]],
          }),
          node("SH50", 6, 10, { expectedGold: 90 }),
        ],
        battlesToGo: 50,
        goalNodesByBattle: new Map([
          [id("FoCM04"), goal("upgDmgU019", 2)],
          [id("IM37"), goal("upgDmgU019", 2)],
          [id("FoCM71"), goal("upgHpL103", 1)],
          [id("FoCM09"), goal("upgArmC003", 3)],
        ]),
      })
    )
    expect(plan.rows.map((row) => row.battleId)).toEqual([
      "FoCM09",
      "IM37",
      "FoCM04",
      "FoCM71",
      "SH50",
    ])
    expect(plan.rows[0]?.goal?.resourceId).toBe("upgArmC003")
  })

  it("prefers a cheaper node over a goal node", () => {
    const plan = planMissionRaids(
      base({
        battles: [
          node("FoCM09", 6, 10, { drops: [["upgArmC003", 0.2]] }),
          node("I28", 5, 10, { drops: [["upgArmC003", 0.2]] }),
        ],
        battlesToGo: 5,
        goalNodesByBattle: new Map([[id("FoCM09"), goal("upgArmC003")]]),
      })
    )
    expect(plan.rows.map((row) => row.battleId)).toEqual(["I28"])
  })

  it("skips a node that no longer fits the budget", () => {
    const plan = planMissionRaids(base({ battlesToGo: 38, dailyEnergy: 30 }))
    expect(plan.totalRaids).toBe(6)
    expect(plan.totalEnergy).toBe(30)
    expect(plan.remainingAfter).toBe(32)
  })

  it("tells filtered-out candidates apart from none", () => {
    expect(planMissionRaids(base({ passesFilter: () => false })).empty).toBe(
      "filtered"
    )
    expect(planMissionRaids(base({ battles: [] })).empty).toBe("no-candidates")
  })

  it("keeps the empty reason to the nodes that drop something", () => {
    const onlyNoDrop = planMissionRaids(base({ battles: noDrop }))
    expect(onlyNoDrop.empty).toBe("no-candidates")
    expect(onlyNoDrop.noDropRows).toHaveLength(9)
    const dropsFiltered = planMissionRaids(
      base({ passesFilter: (battleId) => battleId < "I15" })
    )
    expect(dropsFiltered.empty).toBe("filtered")
    expect(dropsFiltered.noDropRows).toHaveLength(9)
  })

  it("hands the outlook every raidable node", () => {
    const plan = planMissionRaids(base())
    expect(plan.outlookNodes).toHaveLength(24)
    expect(plan.outlookNodes[0]).toEqual({ energyCost: 3, dailyAttempts: 3 })
    expect(plan.dailyEnergy).toBe(538)
  })

  describe("lightning victories", () => {
    const event = [
      node("AMS1", 6, 10, { isEvent: true }),
      node("AMS2", 6, 10, { isEvent: true }),
    ]

    it("suggests event-campaign nodes only", () => {
      const plan = planMissionRaids(
        base({
          battles: [...indomitus, ...event],
          eventOnly: true,
          battlesToGo: 15,
        })
      )
      expect(plan.rows.map((row) => row.battleId)).toEqual(["AMS1", "AMS2"])
      expect(plan.totalRaids).toBe(15)
      expect(plan.noDropRows).toEqual([])
    })

    it("counts only event raids from Today's plan", () => {
      const plan = planMissionRaids(
        base({
          battles: [...indomitus, ...event],
          eventOnly: true,
          battlesToGo: 15,
          plannedByBattle: new Map([
            [id("I06"), 3],
            [id("AMS1"), 4],
          ]),
        })
      )
      expect(plan.plannedCount).toBe(4)
      expect(plan.battlesLeft).toBe(11)
    })

    it("says no campaign event is running", () => {
      const plan = planMissionRaids(base({ eventOnly: true, battlesToGo: 2 }))
      expect(plan.empty).toBe("no-event")
    })
  })
})

describe("remainingPlannedRaids", () => {
  it("subtracts the attempts already used today", () => {
    const remaining = remainingPlannedRaids(
      [
        { battleId: id("I06"), raidsPerformed: 3 },
        { battleId: id("I07"), raidsPerformed: 2 },
        { battleId: id("I07"), raidsPerformed: 1 },
      ],
      new Map([
        [id("I06"), 3],
        [id("I07"), 1],
      ])
    )
    expect([...remaining]).toEqual([[id("I07"), 2]])
  })
})
