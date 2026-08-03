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
      completionDate: "2026-01-04",
    })
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
