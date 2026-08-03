import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import {
  dropRate,
  allocatePlanInventory,
  estimateGoal,
  inclusiveCompletionDate,
  selectFarmNodes,
} from "./estimate"
import { estimatePlan } from "./estimate-plan"
import { shardResourceId } from "../model/estimate.domain"
import type {
  Battle,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  GoalNeed,
} from "../model/estimate.domain"

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
  isMythic: false,
  ...overrides,
})

const battle = (
  id: string,
  energyCost: number,
  dailyAttempts = 999
): [ReturnType<typeof battleId>, Battle] => [
  battleId(id),
  {
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost,
    dailyAttempts,
  },
]

describe("dropRate", () => {
  it("is 1 for a guaranteed drop without an explicit combined rate", () => {
    expect(dropRate(location("B1", { guaranteed: true }))).toBe(1)
  })

  it("prefers effectiveRate when present", () => {
    expect(dropRate(location("B1", { effectiveRate: 0.4 }))).toBe(0.4)
  })

  it("uses a combined effectiveRate above 1 for a guaranteed-plus-bonus location", () => {
    expect(
      dropRate(location("B1", { guaranteed: true, effectiveRate: 1.079 }))
    ).toBe(1.079)
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
      {
        battleId: battleId("B2"),
        energyCost: 10,
        dropRate: 1,
        dailyAttempts: 999,
      },
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
      {
        battleId: battleId("B1"),
        energyCost: 6,
        dropRate: 0.5,
        dailyAttempts: 999,
      },
    ])
  })

  it("keeps a catalog-provided combined guaranteed-plus-bonus yield", () => {
    const combinedReward = new Map<
      ReturnType<typeof upgradeId>,
      EstimateUpgrade
    >([
      [
        upgradeId("shards_character"),
        {
          id: upgradeId("shards_character"),
          farmLocations: [
            location("B1", { guaranteed: true, effectiveRate: 1.079 }),
          ],
        },
      ],
    ])

    const nodes = selectFarmNodes(
      { id: upgradeId("shards_character"), count: 500 },
      combinedReward,
      new Map([battle("B1", 10, 6)])
    )

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.dropRate).toBe(1.079)
  })

  it.each([undefined, ["B1"]])(
    "combines legacy split rewards for one battle with restriction %j",
    (farmingLocationIds) => {
      const splitRewards = new Map<
        ReturnType<typeof upgradeId>,
        EstimateUpgrade
      >([
        [
          upgradeId("shards_character"),
          {
            id: upgradeId("shards_character"),
            farmLocations: [
              location("B1", { guaranteed: true }),
              location("B1", { effectiveRate: 0.079 }),
            ],
          },
        ],
      ])

      const nodes = selectFarmNodes(
        { id: upgradeId("shards_character"), count: 500 },
        splitRewards,
        new Map([battle("B1", 10, 6)]),
        farmingLocationIds
      )

      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toMatchObject({
        battleId: battleId("B1"),
        energyCost: 10,
        dailyAttempts: 6,
      })
      expect(nodes[0]?.dropRate).toBeCloseTo(1.079)
    }
  )

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
      date: "2026-01-03",
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
      date: "2026-01-01",
      energyTotal: 10,
      raidsTotal: 1,
    })
  })
})

describe("inclusiveCompletionDate", () => {
  it.each([
    [0, "2026-01-01"],
    [1, "2026-01-01"],
    [3, "2026-01-03"],
  ])("maps %i required days to %s", (days, expected) => {
    expect(inclusiveCompletionDate(REFERENCE_DATE, days)).toEqual(
      new Date(`${expected}T00:00:00.000Z`)
    )
  })
})

// Worked-example fixture matching the product spec's Battle A/B table: A costs 6 energy, 10 daily
// attempts, 0.4 expected shards/attempt (15 energy/shard); B costs 6 energy, 10 daily attempts, 0.6
// expected shards/attempt (10 energy/shard). A generous dailyEnergy budget (well above what either
// node needs to exhaust its own attempts) isolates the attempts cap as the actual bottleneck, exactly
// like the spec's "assume all available attempts are used each day" framing.
describe("estimateGoal with a daily-attempts cap", () => {
  const battlesById = new Map([battle("A", 6, 10), battle("B", 6, 10)])
  const upgradesById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
    [
      upgradeId("U1"),
      {
        id: upgradeId("U1"),
        farmLocations: [
          location("A", { effectiveRate: 0.4 }),
          location("B", { effectiveRate: 0.6 }),
        ],
      },
    ],
  ])

  it("caps a single node's daily raids at its attempt limit even when energy would allow more", () => {
    const result = estimateGoal({
      needs: [{ id: upgradeId("U1"), count: 320 }],
      upgradesById,
      battlesById,
      dailyEnergy: 100_000,
      farmingLocationIds: ["A"],
      referenceDate: REFERENCE_DATE,
    })
    expect(result).toMatchObject({ days: 80, energyTotal: 4800 })
  })

  it("splits the same remaining need across two selected nodes, each independently attempt-capped", () => {
    const result = estimateGoal({
      needs: [{ id: upgradeId("U1"), count: 320 }],
      upgradesById,
      battlesById,
      dailyEnergy: 100_000,
      farmingLocationIds: ["A", "B"],
      referenceDate: REFERENCE_DATE,
    })
    // 4 shards/day from A + 6 shards/day from B = 10/day, exactly clearing 320 in 32 days at
    // (10 + 10) attempts * 6 energy = 120 energy/day.
    expect(result).toMatchObject({ days: 32, energyTotal: 3840 })
  })

  it("shares one node's attempt cap across two different materials farmed there the same day", () => {
    const twoMaterialUpgrades = new Map<
      ReturnType<typeof upgradeId>,
      EstimateUpgrade
    >([
      [
        upgradeId("U1"),
        {
          id: upgradeId("U1"),
          farmLocations: [location("A", { effectiveRate: 0.4 })],
        },
      ],
      [
        upgradeId("U2"),
        {
          id: upgradeId("U2"),
          farmLocations: [location("A", { effectiveRate: 0.4 })],
        },
      ],
    ])
    const result = estimateGoal({
      needs: [
        { id: upgradeId("U1"), count: 2 },
        { id: upgradeId("U2"), count: 2 },
      ],
      upgradesById: twoMaterialUpgrades,
      battlesById,
      dailyEnergy: 100_000,
      farmingLocationIds: ["A"],
      referenceDate: REFERENCE_DATE,
    })
    // Node A allows 10 raids/day total, shared between U1 and U2 — not 10 raids each — so clearing
    // both (5 raids apiece at 0.4/raid) still takes exactly 1 day.
    expect(result).toMatchObject({ days: 1, energyTotal: 60 })
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
      date: "2026-01-05",
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
})

describe("allocatePlanInventory", () => {
  it("deducts inventory by priority while preserving ordered stage traces", () => {
    const resource = upgradeId("U1")
    const allocations = allocatePlanInventory(
      [
        {
          goalId: "later",
          priority: 2,
          needs: [{ id: resource, count: 5 }],
        },
        {
          goalId: "first",
          priority: 1,
          needs: [{ id: resource, count: 7 }],
          stages: [
            { target: "1", needs: [{ id: resource, count: 4 }] },
            { target: "2", needs: [{ id: resource, count: 3 }] },
          ],
        },
      ],
      [{ id: resource, count: 6 }]
    )

    expect(allocations.get("first")?.stages).toEqual([
      {
        target: "1",
        needs: [{ id: resource, count: 4 }],
        remaining: [],
      },
      {
        target: "2",
        needs: [{ id: resource, count: 3 }],
        remaining: [{ id: resource, count: 1 }],
      },
    ])
    expect(allocations.get("later")?.stages).toEqual([
      {
        target: "final",
        needs: [{ id: resource, count: 5 }],
        remaining: [{ id: resource, count: 5 }],
      },
    ])
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
      date: "2026-01-03",
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
