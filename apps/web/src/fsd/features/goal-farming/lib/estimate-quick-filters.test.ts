import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import type {
  Battle,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  GoalNeed,
} from "../model/estimate.domain"
import {
  estimatePlanSchedule,
  estimateTodaySchedule,
  type EstimatePlanParams,
} from "./estimate-plan"

const upgrade = upgradeIdSchema.parse
const battle = battleIdSchema.parse
const referenceDate = new Date("2026-01-01T00:00:00.000Z")

const location = (id: string, rate = 1): FarmLocation => ({
  battleId: battle(id),
  guaranteed: rate === 1,
  effectiveRate: rate === 1 ? null : rate,
  numerator: null,
  denominator: null,
  isMythic: false,
})
const node = (
  id: string,
  energyCost: number,
  dailyAttempts = 999
): [ReturnType<typeof battle>, Battle] => [
  battle(id),
  {
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost,
    dailyAttempts,
  },
]
const goal = (
  goalId: string,
  priority: number,
  needs: { id: string; count: number }[],
  extra: Partial<GoalNeed> = {}
): GoalNeed => ({
  goalId,
  priority,
  needs: needs.map((need) => ({
    id: need.id as EstimateResourceId,
    count: need.count,
  })),
  ...extra,
})

describe("Fewer raids quick filter", () => {
  // SMALL (6 energy, rate 0.5, 2 raids a day) and BIG (12 energy, guaranteed) both cost 12 energy
  // per item; SMALL alone cannot cover the need, so with the filter off both are raided.
  const battlesById = new Map([node("SMALL", 6, 2), node("BIG", 12)])
  const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
    [
      upgrade("mat"),
      {
        id: upgrade("mat"),
        farmLocations: [location("SMALL", 0.5), location("BIG")],
      },
    ],
  ])
  const params = (extra: Partial<EstimatePlanParams> = {}) => ({
    goals: [goal("g", 1, [{ id: "mat", count: 2 }])],
    upgradesById,
    battlesById,
    dailyEnergy: 100,
    inventory: [],
    referenceDate,
    ...extra,
  })
  const battles = (extra?: Partial<EstimatePlanParams>) =>
    estimateTodaySchedule(params(extra)).entries.map((e) => e.battleId)

  it("uses every tied node when off", () => {
    expect(battles().sort()).toEqual([battle("BIG"), battle("SMALL")].sort())
  })

  it("keeps only the costliest tied node when on", () => {
    expect(battles({ fewerRaids: true })).toEqual([battle("BIG")])
    expect(estimateTodaySchedule(params({ fewerRaids: true })).raidsTotal).toBe(
      2
    )
  })

  it("leaves pinned locations as chosen", () => {
    const pinned = goal("g", 1, [{ id: "mat", count: 2 }], {
      farmingLocationIds: ["SMALL", "BIG"],
    })
    expect(battles({ fewerRaids: true, goals: [pinned] }).sort()).toEqual(
      [battle("BIG"), battle("SMALL")].sort()
    )
  })
})

describe("Bottlenecks quick filter", () => {
  // FAST drops `quick` guaranteed; SLOW drops `slow` at 0.1 with a cap of 2 raids a day.
  const battlesById = new Map([node("FAST", 10), node("SLOW", 10, 2)])
  const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
    [
      upgrade("quick"),
      { id: upgrade("quick"), farmLocations: [location("FAST")] },
    ],
    [
      upgrade("slow"),
      { id: upgrade("slow"), farmLocations: [location("SLOW", 0.1)] },
    ],
  ])
  const goals = [
    goal("a", 1, [{ id: "quick", count: 5 }]),
    goal("b", 2, [{ id: "slow", count: 2 }]),
  ]
  const params = (extra: Partial<EstimatePlanParams> = {}) => ({
    goals,
    upgradesById,
    battlesById,
    dailyEnergy: 20,
    inventory: [],
    referenceDate,
    ...extra,
  })

  it("spends energy goal by goal in priority order when off", () => {
    const today = estimateTodaySchedule(params())
    expect(today.entries.map((e) => [e.goalId, e.resourceId])).toEqual([
      ["a", "quick"],
    ])
  })

  it("farms the longest-to-finish material first, credited to its goal, when on", () => {
    const today = estimateTodaySchedule(params({ combineGoals: true }))
    expect(
      today.entries.map((e) => [e.goalId, e.resourceId, e.raidsPerformed])
    ).toEqual([["b", "slow", 2]])
  })

  it("credits a shared material to the highest-priority goal and consumes it in priority order", () => {
    const shared = [
      goal("a", 1, [{ id: "quick", count: 2 }]),
      goal("b", 2, [{ id: "quick", count: 2 }]),
    ]
    const plan = estimatePlanSchedule(
      params({ goals: shared, combineGoals: true, dailyEnergy: 30 })
    )
    expect(
      plan.days[0]!.entries.map((e) => [e.goalId, e.raidsPerformed])
    ).toEqual([["a", 3]])
    expect(plan.outcomes.get("a")).toMatchObject({ days: 1 })
    expect(plan.outcomes.get("b")).toMatchObject({ days: 2 })
  })

  it("pools every stage of a goal", () => {
    const staged = goal("s", 1, [], {
      stages: [
        {
          target: "first",
          needs: [{ id: "quick" as EstimateResourceId, count: 1 }],
        },
        {
          target: "second",
          needs: [{ id: "slow" as EstimateResourceId, count: 2 }],
        },
      ],
    })
    const resources = (combineGoals: boolean) =>
      estimateTodaySchedule(params({ goals: [staged], combineGoals }))
        .entries.map((e) => e.resourceId)
        .sort()
    expect(resources(false)).toEqual(["quick", "slow"])
    expect(resources(true)).toEqual(["slow"])
  })
})
