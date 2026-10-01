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
  FarmNodeFilter,
  GoalNeed,
} from "../model/estimate.domain"
import { selectFarmNodes } from "./estimate"
import {
  estimateBonusRaids,
  estimatePlanSchedule,
  estimateTodayRun,
  estimateTodaySchedule,
} from "./estimate-plan"

const upgrade = upgradeIdSchema.parse
const battle = battleIdSchema.parse
const referenceDate = new Date("2026-01-01T00:00:00.000Z")

const location = (id: string): FarmLocation => ({
  battleId: battle(id),
  guaranteed: true,
  effectiveRate: null,
  numerator: null,
  denominator: null,
  isMythic: false,
})
const node = (
  id: string,
  energyCost: number
): [ReturnType<typeof battle>, Battle] => [
  battle(id),
  {
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost,
    dailyAttempts: 999,
  },
]

// CHEAP (5 energy) is the preferred node, PRICEY (10) the only alternative, TIED (5) ties CHEAP.
const battlesById = new Map([
  node("CHEAP", 5),
  node("PRICEY", 10),
  node("TIED", 5),
])
const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
  [
    upgrade("mat"),
    {
      id: upgrade("mat"),
      farmLocations: [location("CHEAP"), location("PRICEY")],
    },
  ],
  [
    upgrade("tied"),
    {
      id: upgrade("tied"),
      farmLocations: [location("CHEAP"), location("TIED"), location("PRICEY")],
    },
  ],
  // A character shard resource goes through the very same path as an upgrade.
  [
    "shard:hero" as EstimateResourceId,
    {
      id: "shard:hero" as EstimateResourceId,
      farmLocations: [location("CHEAP"), location("PRICEY")],
    },
  ],
])
const goal = (
  id: string,
  resource: string,
  extra: Partial<GoalNeed> = {}
): GoalNeed => ({
  goalId: id,
  priority: 1,
  needs: [{ id: resource as EstimateResourceId, count: 4 }],
  ...extra,
})
const params = (goals: GoalNeed[], nodeFilter?: FarmNodeFilter) => ({
  goals,
  upgradesById,
  battlesById,
  dailyEnergy: 100,
  inventory: [],
  referenceDate,
  nodeFilter,
})
const allow =
  (...ids: string[]): FarmNodeFilter =>
  (battleId) =>
    ids.includes(battleId)

describe("nodeFilter in the Today/Bonus engine run", () => {
  it("blocks a material whose cheapest node is filtered out, without falling back to a pricier node", () => {
    for (const resource of ["mat", "shard:hero"]) {
      const { today, filteredOut } = estimateTodayRun(
        params([goal("g", resource)], allow("PRICEY"))
      )
      expect(today.entries).toEqual([])
      expect(filteredOut).toEqual([
        { goalId: "g", resourceId: resource, remaining: 4, pinned: false },
      ])
    }
  })

  it("keeps a material scheduled on the tied node that passes", () => {
    const { today, filteredOut } = estimateTodayRun(
      params([goal("g", "tied")], allow("TIED"))
    )
    expect(today.entries.map((entry) => entry.battleId)).toEqual([
      battle("TIED"),
    ])
    expect(filteredOut).toEqual([])
  })

  it("leaves a passing preferred node unchanged", () => {
    const unfiltered = estimateTodaySchedule(params([goal("g", "mat")]))
    const filtered = estimateTodaySchedule(
      params([goal("g", "mat")], allow("CHEAP", "TIED"))
    )
    expect(filtered).toEqual(unfiltered)
  })

  it("an undefined filter is the unfiltered behavior", () => {
    const goals = [goal("g", "mat"), goal("h", "tied", { priority: 2 })]
    expect(estimateTodayRun(params(goals)).filteredOut).toEqual([])
    expect(estimatePlanSchedule(params(goals, undefined))).toEqual(
      estimatePlanSchedule(params(goals))
    )
  })

  it("does not bypass the filter for a goal pinned to a failing node, and flags the pin", () => {
    const pinned = goal("g", "mat", { farmingLocationIds: ["PRICEY"] })
    const { today, filteredOut } = estimateTodayRun(
      params([pinned], allow("CHEAP"))
    )
    expect(today.entries).toEqual([])
    expect(filteredOut).toEqual([
      { goalId: "g", resourceId: "mat", remaining: 4, pinned: true },
    ])
  })

  it("schedules a goal pinned to a node that passes the filter", () => {
    const pinned = goal("g", "mat", { farmingLocationIds: ["PRICEY"] })
    const { today, filteredOut } = estimateTodayRun(
      params([pinned], allow("PRICEY"))
    )
    expect(today.entries.map((entry) => entry.battleId)).toEqual([
      battle("PRICEY"),
    ])
    expect(filteredOut).toEqual([])
  })

  it("applies to Bonus Raids too", () => {
    // `big` spends the whole day's energy, so `tied` is left for Bonus Raids.
    const goals = [
      goal("big", "mat", { needs: [{ id: upgrade("mat"), count: 400 }] }),
      goal("later", "tied", { priority: 2 }),
    ]
    const small = (nodeFilter?: FarmNodeFilter) => ({
      ...params(goals, nodeFilter),
      dailyEnergy: 10,
    })
    expect(
      estimateBonusRaids(small()).entries.map((e) => e.resourceId)
    ).toEqual(["tied"])
    expect(estimateBonusRaids(small(allow("PRICEY"))).entries).toEqual([])
  })

  it("selectFarmNodes picks the cheapest set first, then drops failing nodes", () => {
    const need = { id: upgrade("tied"), count: 1 }
    const ids = (nodes: { battleId: string }[]) =>
      nodes.map((n) => n.battleId).sort()
    expect(ids(selectFarmNodes(need, upgradesById, battlesById))).toEqual([
      "CHEAP",
      "TIED",
    ])
    expect(
      ids(
        selectFarmNodes(
          need,
          upgradesById,
          battlesById,
          null,
          allow("TIED", "PRICEY")
        )
      )
    ).toEqual(["TIED"])
    expect(
      selectFarmNodes(need, upgradesById, battlesById, null, allow("PRICEY"))
    ).toEqual([])
  })
})
