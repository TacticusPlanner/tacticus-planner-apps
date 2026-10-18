import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import {
  planMissionRaids,
  remainingPlannedRaids,
  type MissionRaidBattle,
  type PlanMissionRaidsInput,
} from "./mission-raids"

const id = (value: string) => value as BattleId

// Indomitus I06-I14 cost 3 with a cap of 3, I15-I29 cost 5 with a cap of 10.
const indomitus: MissionRaidBattle[] = [
  ...Array.from({ length: 9 }, (_, index) => ({
    id: id(`I${String(index + 6).padStart(2, "0")}`),
    energyCost: 3,
    dailyAttempts: 3,
    isEvent: false,
  })),
  ...Array.from({ length: 15 }, (_, index) => ({
    id: id(`I${index + 15}`),
    energyCost: 5,
    dailyAttempts: 10,
    isEvent: false,
  })),
]

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
const today = {
  id: id("SH01"),
  energyCost: 6,
  dailyAttempts: 10,
  isEvent: false,
}
const withToday = (overrides: Partial<PlanMissionRaidsInput> = {}) =>
  base({
    battles: [
      ...indomitus,
      today,
      { ...today, id: id("SH02") },
      { ...today, id: id("SH03") },
    ],
    plannedByBattle: new Map([
      [id("SH01"), 10],
      [id("SH02"), 10],
      [id("SH03"), 5],
    ]),
    realEnergyUsedToday: 200,
    ...overrides,
  })

describe("planMissionRaids", () => {
  it("counts Today's plan first and reserves its energy", () => {
    const plan = planMissionRaids(withToday())
    expect(plan.plannedCount).toBe(25)
    expect(plan.battlesLeft).toBe(38)
    expect(plan.energyBudget).toBe(538 - 200 - 150)
  })

  it("fills the worked example: 3-energy nodes first, then 5-energy", () => {
    const plan = planMissionRaids(withToday())
    const raids = Object.fromEntries(
      plan.rows.map((row) => [row.battleId, row.raids])
    )
    for (let node = 6; node <= 14; node++) {
      expect(raids[`I${String(node).padStart(2, "0")}`]).toBe(3)
    }
    expect(raids.I15).toBe(10)
    expect(raids.I16).toBe(1)
    expect(plan.totalRaids).toBe(38)
    expect(plan.totalEnergy).toBe(81 + 55)
    expect(plan.remainingAfter).toBe(0)
  })

  it("says Today's plan completes the objective", () => {
    const plan = planMissionRaids(withToday({ battlesToGo: 20 }))
    expect(plan.rows).toEqual([])
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

  it("leaves a node's attempts to Today's plan and synced usage", () => {
    const battles = [
      { id: id("I30"), energyCost: 6, dailyAttempts: 10, isEvent: false },
    ]
    const plan = planMissionRaids(
      base({
        battles,
        battlesToGo: 50,
        attemptsLeftByBattle: new Map([[id("I30"), 6]]),
        plannedByBattle: new Map([[id("I30"), 3]]),
      })
    )
    expect(plan.rows[0]?.raids).toBe(3)
  })

  it("breaks equal-cost ties by goal priority, then battle id", () => {
    const fives = indomitus.filter((battle) => battle.energyCost === 5)
    const plan = planMissionRaids(
      base({
        battles: fives,
        battlesToGo: 20,
        goalNodesByBattle: new Map([
          [
            id("I17"),
            { priority: 1, goalIds: ["g1"], resourceId: "upgDmgC002" as never },
          ],
        ]),
      })
    )
    expect(plan.rows.map((row) => row.battleId)).toEqual(["I17", "I15"])
    expect(plan.rows[0]?.goal?.goalIds).toEqual(["g1"])
  })

  it("skips a node that no longer fits the budget", () => {
    const plan = planMissionRaids(base({ battlesToGo: 38, dailyEnergy: 30 }))
    expect(plan.totalRaids).toBe(10)
    expect(plan.totalEnergy).toBe(30)
    expect(plan.remainingAfter).toBe(28)
  })

  it("tells filtered-out candidates apart from none", () => {
    expect(planMissionRaids(base({ passesFilter: () => false })).empty).toBe(
      "filtered"
    )
    expect(planMissionRaids(base({ battles: [] })).empty).toBe("no-candidates")
  })

  it("reports the cheapest cost and its daily capacity", () => {
    const plan = planMissionRaids(base())
    expect(plan.cheapestEnergyCost).toBe(3)
    expect(plan.cheapestDailyCapacity).toBe(27)
  })

  describe("lightning victories", () => {
    const event = [
      { id: id("AMS1"), energyCost: 6, dailyAttempts: 10, isEvent: true },
      { id: id("AMS2"), energyCost: 6, dailyAttempts: 10, isEvent: true },
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
