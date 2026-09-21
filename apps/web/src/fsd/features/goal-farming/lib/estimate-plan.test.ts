import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import type {
  Battle,
  EstimateUpgrade,
  FarmLocation,
  GoalNeed,
} from "../model/estimate.domain"
import {
  estimateBonusRaids,
  estimatePlanSchedule,
  estimateTodaySchedule,
} from "./estimate-plan"

const upgradeId = upgradeIdSchema.parse
const battleId = battleIdSchema.parse
const referenceDate = new Date("2026-01-01T00:00:00.000Z")

const location = (id: string): FarmLocation => ({
  battleId: battleId(id),
  guaranteed: true,
  effectiveRate: null,
  numerator: null,
  denominator: null,
  isMythic: false,
})

const battle = (
  id: string,
  dailyAttempts = 999
): [ReturnType<typeof battleId>, Battle] => [
  battleId(id),
  {
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: 10,
    dailyAttempts,
  },
]

const resources = (...entries: [string, string][]) =>
  new Map(
    entries.map(([resource, node]) => [
      upgradeId(resource),
      {
        id: upgradeId(resource),
        farmLocations: [location(node)],
      } satisfies EstimateUpgrade,
    ])
  )

describe("plan reflects selectFarmNodes' gold tie-break (fix-daily-raid-location-recommendations)", () => {
  it("Raids Plan's Day 1 (== Today's schedule) picks the higher-expectedGold tied battle", () => {
    const tiedLocations: FarmLocation[] = [
      { ...location("FoCE13"), expectedGold: 137 },
      { ...location("SHME19"), expectedGold: 151.5 },
    ]
    const day = estimateTodaySchedule({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [{ id: upgradeId("upgDmgC010"), count: 1 }],
        },
      ],
      upgradesById: new Map([
        [
          upgradeId("upgDmgC010"),
          { id: upgradeId("upgDmgC010"), farmLocations: tiedLocations },
        ],
      ]),
      battlesById: new Map([battle("FoCE13"), battle("SHME19")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(day.entries).toHaveLength(1)
    expect(day.entries[0]?.battleId).toEqual(battleId("SHME19"))
  })
})

describe("raid schedule breakdown", () => {
  it("tags entries by goal and enforces one shared battle cap across goals", () => {
    const goals: GoalNeed[] = [
      { goalId: "a", priority: 1, needs: [{ id: upgradeId("U1"), count: 3 }] },
      { goalId: "b", priority: 2, needs: [{ id: upgradeId("U2"), count: 3 }] },
    ]
    const day = estimateTodaySchedule({
      goals,
      upgradesById: resources(["U1", "B1"], ["U2", "B1"]),
      battlesById: new Map([battle("B1", 5)]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(
      day.entries.map(({ goalId, raidsPerformed }) => ({
        goalId,
        raidsPerformed,
      }))
    ).toEqual([
      { goalId: "a", raidsPerformed: 3 },
      { goalId: "b", raidsPerformed: 2 },
    ])
    expect(day.attemptsUsedByBattle.get(battleId("B1"))).toBe(5)
    expect(day.energyTotal).toBe(
      day.entries.reduce((total, entry) => total + entry.energySpent, 0)
    )
    expect(day.raidsTotal).toBe(
      day.entries.reduce((total, entry) => total + entry.raidsPerformed, 0)
    )
  })

  it("carries inventory forward and resets battle caps on later days", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 7 }],
        },
      ],
      upgradesById: resources(["U1", "B1"]),
      battlesById: new Map([battle("B1", 2)]),
      dailyEnergy: 100,
      inventory: [{ id: upgradeId("U1"), count: 2 }],
      referenceDate,
    })

    expect(plan.days.map((day) => day.raidsTotal)).toEqual([2, 2, 1])
    expect(plan.summary).toEqual({
      totalDays: 3,
      totalEnergy: 50,
      totalRaids: 5,
      daysWithUnusedEnergy: 3,
      completionDate: "2026-01-03",
    })
  })

  it("uses Today as the completion date for a one-day plan", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
      ],
      upgradesById: resources(["U1", "B1"]),
      battlesById: new Map([battle("B1")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(plan.summary.totalDays).toBe(1)
    expect(plan.summary.completionDate).toBe("2026-01-01")
  })
})

describe("bonus raids", () => {
  it("excludes a resource that was partially raided in the real schedule", () => {
    const bonus = estimateBonusRaids({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [
            { id: upgradeId("U1"), count: 3 },
            { id: upgradeId("U2"), count: 2 },
          ],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"]),
      battlesById: new Map([battle("B1"), battle("B2")]),
      dailyEnergy: 20,
      inventory: [],
      referenceDate,
    })

    expect(bonus.entries.map((entry) => entry.resourceId)).toEqual([
      upgradeId("U2"),
    ])
    expect([...bonus.attemptsUsedByBattle]).toEqual([[battleId("B2"), 2]])
  })

  it("keeps qualifying entries in goal-priority order", () => {
    const bonus = estimateBonusRaids({
      goals: [
        {
          goalId: "third",
          priority: 3,
          needs: [{ id: upgradeId("U3"), count: 1 }],
        },
        {
          goalId: "first",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
        {
          goalId: "second",
          priority: 2,
          needs: [{ id: upgradeId("U2"), count: 1 }],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"], ["U3", "B3"]),
      battlesById: new Map([battle("B1"), battle("B2"), battle("B3")]),
      dailyEnergy: 10,
      inventory: [],
      referenceDate,
    })

    expect(bonus.entries.map((entry) => entry.goalId)).toEqual([
      "second",
      "third",
    ])
    expect([...bonus.attemptsUsedByBattle]).toEqual([
      [battleId("B2"), 1],
      [battleId("B3"), 1],
    ])
  })
})

describe("shared daily energy budget (goal-farming-estimates)", () => {
  // The spec's worked example: one 100-energy day, a 10-energy node per raid with no binding
  // attempt cap, so each day funds 10 raids that the goals must share in priority order.
  const workedExample = (trajannPriority: number, aesothPriority: number) =>
    estimatePlanSchedule({
      goals: [
        {
          goalId: "trajann",
          priority: trajannPriority,
          needs: [{ id: upgradeId("U1"), count: 25 }],
        },
        {
          goalId: "aesoth",
          priority: aesothPriority,
          needs: [{ id: upgradeId("U2"), count: 10 }],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"]),
      battlesById: new Map([battle("B1"), battle("B2")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

  it("makes a lower-priority goal wait for the energy a higher-priority goal leaves", () => {
    const plan = workedExample(1, 2)

    // Days 1-2 go entirely to Trajann (10 raids each); day 3 finishes its last 5 raids and hands
    // the surviving 50 energy to Aesoth; day 4 finishes Aesoth's last 5.
    expect(plan.outcomes.get("trajann")?.days).toBe(3)
    expect(plan.outcomes.get("aesoth")?.days).toBe(4)
    expect(plan.days.map((day) => day.raidsTotal)).toEqual([10, 10, 10, 5])
  })

  it("estimates the same lower-priority goal alone in a single day", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "aesoth",
          priority: 2,
          needs: [{ id: upgradeId("U2"), count: 10 }],
        },
      ],
      upgradesById: resources(["U2", "B2"]),
      battlesById: new Map([battle("B2")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    // The divergence V1 reports: per-material budgeting would date Aesoth here, not on day 4.
    expect(plan.outcomes.get("aesoth")?.days).toBe(1)
  })

  it("reorders the dates when the priorities are reordered", () => {
    const plan = workedExample(2, 1)

    // Not a mirror of the 3/4 base case: Aesoth alone finishes in one day, and Trajann then farms
    // on the remainder for four.
    expect(plan.outcomes.get("aesoth")?.days).toBe(1)
    expect(plan.outcomes.get("trajann")?.days).toBe(4)
  })

  it("lets an energy-free supplier complete a goal on a day the pool is exhausted", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "trajann",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 25 }],
        },
        {
          goalId: "aesoth",
          priority: 2,
          needs: [{ id: upgradeId("U2"), count: 10 }],
          flatSuppliers: [
            {
              key: "shop:daily",
              resourceId: upgradeId("U2"),
              supplyOnDay: () => 10,
            },
          ],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"]),
      battlesById: new Map([battle("B1"), battle("B2")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(plan.outcomes.get("aesoth")?.days).toBe(1)
    expect(plan.outcomes.get("trajann")?.days).toBe(3)
    // Day 1's energy all went to Trajann; Aesoth finished without spending any.
    expect(plan.days[0]?.energyTotal).toBe(100)
  })
})
