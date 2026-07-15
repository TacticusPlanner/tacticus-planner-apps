import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import {
  dropRate,
  estimateGoal,
  estimatePlan,
  selectFarmNodes,
} from "./estimate"
import { shardResourceId } from "./estimate.domain"
import type {
  Battle,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  GoalNeed,
} from "./estimate.domain"

const upgradeId = upgradeIdSchema.parse
const battleId = battleIdSchema.parse

const REFERENCE_DATE = new Date("2026-01-01T00:00:00.000Z")

const location = (
  battle: string,
  overrides: Partial<FarmLocation> = {}
): FarmLocation => ({
  battleId: battleId(battle),
  guaranteed: false,
  effectiveRate: null,
  numerator: null,
  denominator: null,
  ...overrides,
})

const battle = (
  id: string,
  energyCost: number
): [ReturnType<typeof battleId>, Battle] => [
  battleId(id),
  {
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost,
  },
]

describe("dropRate", () => {
  it("is 1 for a guaranteed drop, regardless of any rate fields", () => {
    expect(dropRate(location("B1", { guaranteed: true }))).toBe(1)
  })

  it("prefers effectiveRate when present", () => {
    expect(dropRate(location("B1", { effectiveRate: 0.4 }))).toBe(0.4)
  })

  it("falls back to numerator/denominator", () => {
    expect(dropRate(location("B1", { numerator: 1, denominator: 4 }))).toBe(
      0.25
    )
  })

  it("is 0 with no rate information", () => {
    expect(dropRate(location("B1"))).toBe(0)
  })
})

describe("selectFarmNodes", () => {
  const upgradesById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
    [
      upgradeId("U1"),
      {
        id: upgradeId("U1"),
        farmLocations: [
          // energyPerItem: 6/0.5 = 12
          location("B1", { effectiveRate: 0.5 }),
          // energyPerItem: 10/1 = 10 — cheaper, should win
          location("B2", { guaranteed: true }),
          // zero energy cost — never selectable
          location("B3", { guaranteed: true }),
        ],
      },
    ],
  ])
  const battlesById = new Map([
    battle("B1", 6),
    battle("B2", 10),
    battle("B3", 0),
  ])

  it("keeps only the least-energy-per-item node by default", () => {
    const nodes = selectFarmNodes(
      { id: upgradeId("U1"), count: 1 },
      upgradesById,
      battlesById
    )
    expect(nodes).toEqual([
      { battleId: battleId("B2"), energyCost: 10, dropRate: 1 },
    ])
  })

  it("restricts to farmingLocationIds when given, even if not least-energy", () => {
    const nodes = selectFarmNodes(
      { id: upgradeId("U1"), count: 1 },
      upgradesById,
      battlesById,
      ["B1"]
    )
    expect(nodes).toEqual([
      { battleId: battleId("B1"), energyCost: 6, dropRate: 0.5 },
    ])
  })

  it("is empty for a material with no catalog entry", () => {
    expect(
      selectFarmNodes(
        { id: upgradeId("unknown"), count: 1 },
        upgradesById,
        battlesById
      )
    ).toEqual([])
  })
})

describe("estimateGoal", () => {
  const upgradesById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
    [
      upgradeId("U1"),
      {
        id: upgradeId("U1"),
        farmLocations: [location("B1", { guaranteed: true })],
      },
    ],
    [
      upgradeId("unfarmable"),
      { id: upgradeId("unfarmable"), farmLocations: [] },
    ],
  ])
  const battlesById = new Map([battle("B1", 10)])

  it("computes days/date from one raid per day at dailyEnergy's budget", () => {
    const result = estimateGoal({
      needs: [{ id: upgradeId("U1"), count: 3 }],
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      referenceDate: REFERENCE_DATE,
    })
    expect(result).toMatchObject({
      days: 3,
      date: "2026-01-04",
      energyTotal: 30,
      raidsTotal: 3,
    })
  })

  it("returns days:0 for an already-satisfied need", () => {
    expect(
      estimateGoal({
        needs: [{ id: upgradeId("U1"), count: 0 }],
        upgradesById,
        battlesById,
        dailyEnergy: 10,
        referenceDate: REFERENCE_DATE,
      })
    ).toMatchObject({
      days: 0,
      date: "2026-01-01",
      energyTotal: 0,
      raidsTotal: 0,
    })
  })

  it("returns null for a material with no farm location", () => {
    expect(
      estimateGoal({
        needs: [{ id: upgradeId("unfarmable"), count: 1 }],
        upgradesById,
        battlesById,
        dailyEnergy: 10,
        referenceDate: REFERENCE_DATE,
      })
    ).toMatchObject({ status: "Blocked", reason: "NoFarmLocation" })
  })

  it("returns null (MAX_DAYS guard) when the daily budget can never afford the node", () => {
    expect(
      estimateGoal({
        needs: [{ id: upgradeId("U1"), count: 1 }],
        upgradesById,
        battlesById,
        dailyEnergy: 5,
        referenceDate: REFERENCE_DATE,
      })
    ).toMatchObject({ status: "Blocked", reason: "InsufficientDailyEnergy" })
  })

  it("honors farmingLocationIds even when a cheaper node exists elsewhere", () => {
    const multiById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
      [
        upgradeId("U1"),
        {
          id: upgradeId("U1"),
          farmLocations: [
            location("B1", { guaranteed: true }), // energyPerItem 10
            location("B2", { guaranteed: true }), // energyPerItem 5 — cheaper, but excluded below
          ],
        },
      ],
    ])
    const multiBattlesById = new Map([battle("B1", 10), battle("B2", 5)])

    const result = estimateGoal({
      needs: [{ id: upgradeId("U1"), count: 1 }],
      upgradesById: multiById,
      battlesById: multiBattlesById,
      dailyEnergy: 10,
      farmingLocationIds: ["B1"],
      referenceDate: REFERENCE_DATE,
    })
    expect(result).toMatchObject({
      days: 1,
      date: "2026-01-02",
      energyTotal: 10,
      raidsTotal: 1,
    })
  })
})

describe("estimatePlan", () => {
  const upgradesById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
    [
      upgradeId("U1"),
      {
        id: upgradeId("U1"),
        farmLocations: [location("B1", { guaranteed: true })],
      },
    ],
  ])
  const battlesById = new Map([battle("B1", 10)])

  it("lets a higher-priority goal claim shared inventory first, inflating the lower-priority goal's days", () => {
    const goals: GoalNeed[] = [
      {
        goalId: "low-priority",
        priority: 2,
        needs: [{ id: upgradeId("U1"), count: 5 }],
      },
      {
        goalId: "high-priority",
        priority: 1,
        needs: [{ id: upgradeId("U1"), count: 5 }],
      },
    ]

    const results = estimatePlan({
      goals,
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      inventory: [{ id: upgradeId("U1"), count: 5 }],
      referenceDate: REFERENCE_DATE,
    })

    // priority 1 consumes all 5 owned copies -> already satisfied, days: 0
    expect(results.get("high-priority")).toMatchObject({
      days: 0,
      date: "2026-01-01",
      energyTotal: 0,
      raidsTotal: 0,
    })
    // priority 2 gets none of the shared inventory -> must farm all 5 (1/day at this budget)
    expect(results.get("low-priority")).toMatchObject({
      days: 5,
      date: "2026-01-06",
      energyTotal: 50,
      raidsTotal: 5,
    })
  })

  it("spends each day's energy goal-by-goal in priority order, not split evenly", () => {
    const goals: GoalNeed[] = [
      { goalId: "b", priority: 2, needs: [{ id: upgradeId("U1"), count: 2 }] },
      { goalId: "a", priority: 1, needs: [{ id: upgradeId("U1"), count: 2 }] },
    ]

    const results = estimatePlan({
      goals,
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      inventory: [],
      referenceDate: REFERENCE_DATE,
    })

    // "a" (priority 1) gets first claim on every day's energy and finishes in 2 days; "b" only
    // farms on the days "a" doesn't need the full budget, finishing in 4.
    expect(results.get("a")?.days).toBe(2)
    expect(results.get("b")?.days).toBe(4)
  })

  it("returns null for a goal whose material can never be farmed", () => {
    const goals: GoalNeed[] = [
      {
        goalId: "blocked",
        priority: 1,
        needs: [{ id: upgradeId("unfarmable"), count: 1 }],
      },
    ]

    const results = estimatePlan({
      goals,
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      inventory: [],
      referenceDate: REFERENCE_DATE,
    })

    expect(results.get("blocked")).toMatchObject({
      status: "Blocked",
      reason: "NoFarmLocation",
    })
  })

  it("farms pooled materials independently of goal priority for TotalMaterials", () => {
    const pooledUpgrades = new Map<
      ReturnType<typeof upgradeId>,
      EstimateUpgrade
    >([
      [
        upgradeId("U1"),
        {
          id: upgradeId("U1"),
          farmLocations: [location("B1", { guaranteed: true })],
        },
      ],
      [
        upgradeId("U2"),
        {
          id: upgradeId("U2"),
          farmLocations: [location("B1", { guaranteed: true })],
        },
      ],
    ])
    const results = estimatePlan({
      goals: [
        {
          goalId: "high",
          priority: 1,
          needs: [{ id: upgradeId("U2"), count: 1 }],
        },
        {
          goalId: "low",
          priority: 2,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
      ],
      upgradesById: pooledUpgrades,
      battlesById,
      dailyEnergy: 10,
      inventory: [],
      ordering: "TotalMaterials",
      referenceDate: REFERENCE_DATE,
    })

    // U1 is selected first by the stable pooled resource order even though its consumer is lower
    // priority; GoalPriority mode would complete "high" first.
    expect(results.get("low")?.days).toBe(1)
    expect(results.get("high")?.days).toBe(2)
  })

  it("attributes a shared pooled material to project priority", () => {
    const results = estimatePlan({
      goals: [
        {
          goalId: "low",
          priority: 2,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
        {
          goalId: "high",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
      ],
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      inventory: [],
      ordering: "TotalMaterials",
      referenceDate: REFERENCE_DATE,
    })

    expect(results.get("high")?.days).toBe(1)
    expect(results.get("low")?.days).toBe(2)
  })
})

describe("estimateGoal with a farmable shard resource (plan §16 phase 7)", () => {
  it("clears a shard need through the same engine as materials, via a synthetic EstimateUpgrade entry", () => {
    const shardId = shardResourceId("hero1")
    const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
      [
        shardId,
        { id: shardId, farmLocations: [location("B1", { guaranteed: true })] },
      ],
    ])
    const battlesById = new Map([battle("B1", 10)])

    const result = estimateGoal({
      needs: [{ id: shardId, count: 3 }],
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      referenceDate: REFERENCE_DATE,
    })

    expect(result).toMatchObject({
      days: 3,
      date: "2026-01-04",
      energyTotal: 30,
      raidsTotal: 3,
    })
  })

  it("mixes a shard resource and a material need in the same estimate", () => {
    const shardId = shardResourceId("hero1")
    const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
      [
        shardId,
        { id: shardId, farmLocations: [location("B1", { guaranteed: true })] },
      ],
      [
        upgradeId("U1"),
        {
          id: upgradeId("U1"),
          farmLocations: [location("B1", { guaranteed: true })],
        },
      ],
    ])
    const battlesById = new Map([battle("B1", 10)])

    const result = estimateGoal({
      needs: [
        { id: shardId, count: 1 },
        { id: upgradeId("U1"), count: 1 },
      ],
      upgradesById,
      battlesById,
      dailyEnergy: 10,
      referenceDate: REFERENCE_DATE,
    })

    // Both share the same single node — one raid/day clears one unit of whichever is spendable
    // first, so it takes 2 days total to clear both.
    expect(result?.days).toBe(2)
  })
})
