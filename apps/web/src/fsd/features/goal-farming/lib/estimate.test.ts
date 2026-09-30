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
  spendDay,
} from "./estimate"
import { estimatePlan } from "./estimate-plan"
import { shardResourceId } from "../model/estimate.domain"
import type {
  Battle,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  FarmNode,
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
    battleIndex: 0,
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

  describe("tied nodes", () => {
    // FoCE13/SHME19 both cost 10 energy for one guaranteed copy (energyPerItem 10), differing only
    // in expected gold - matches the fix-daily-raid-location-recommendations spec's worked example.
    const tiedUpgrade = (
      foceExpectedGold: number | null,
      shmeExpectedGold: number | null
    ) =>
      new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
        [
          upgradeId("upgDmgC010"),
          {
            id: upgradeId("upgDmgC010"),
            farmLocations: [
              location("FoCE13", {
                guaranteed: true,
                expectedGold: foceExpectedGold,
              }),
              location("SHME19", {
                guaranteed: true,
                expectedGold: shmeExpectedGold,
              }),
            ],
          },
        ],
      ])
    const tiedBattles = new Map([battle("FoCE13", 10), battle("SHME19", 10)])
    const select = (foce: number | null, shme: number | null) =>
      selectFarmNodes(
        { id: upgradeId("upgDmgC010"), count: 1 },
        tiedUpgrade(foce, shme),
        tiedBattles
      ).map((node) => node.battleId)

    it("returns every tied node, higher expectedGold first", () => {
      expect(select(137, 151.5)).toEqual([
        battleId("SHME19"),
        battleId("FoCE13"),
      ])
    })

    it("keeps a tied node with null expectedGold, last", () => {
      expect(select(null, 151.5)).toEqual([
        battleId("SHME19"),
        battleId("FoCE13"),
      ])
    })

    it("keeps a tied node with expectedGold entirely absent, last", () => {
      const untyped = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
        [
          upgradeId("upgDmgC010"),
          {
            id: upgradeId("upgDmgC010"),
            farmLocations: [
              location("FoCE13", { guaranteed: true }),
              location("SHME19", { guaranteed: true, expectedGold: 151.5 }),
            ],
          },
        ],
      ])
      const nodes = selectFarmNodes(
        { id: upgradeId("upgDmgC010"), count: 1 },
        untyped,
        tiedBattles
      )
      expect(nodes.map((node) => node.battleId)).toEqual([
        battleId("SHME19"),
        battleId("FoCE13"),
      ])
    })

    it("keeps existing order when expectedGold is equal or missing", () => {
      expect(select(100, 100)).toEqual([battleId("FoCE13"), battleId("SHME19")])
      expect(select(null, null)).toEqual([
        battleId("FoCE13"),
        battleId("SHME19"),
      ])
    })

    it("never lets expectedGold override a genuine efficiency difference", () => {
      const upgradesByIdLocal = new Map<
        ReturnType<typeof upgradeId>,
        EstimateUpgrade
      >([
        [
          upgradeId("U1"),
          {
            id: upgradeId("U1"),
            farmLocations: [
              // energyPerItem 10 - cheaper, should win despite the lower expectedGold
              location("B2", { guaranteed: true, expectedGold: 10 }),
              // energyPerItem 12 - less efficient, higher expectedGold doesn't matter
              location("B1", { effectiveRate: 0.5, expectedGold: 999 }),
            ],
          },
        ],
      ])

      const nodes = selectFarmNodes(
        { id: upgradeId("U1"), count: 1 },
        upgradesByIdLocal,
        battlesById
      )

      expect(nodes.map((node) => node.battleId)).toEqual([battleId("B2")])
    })

    describe("two-decimal efficiency rounding", () => {
      // energyCost 1 so energyPerItem = 1 / dropRate.
      const pick = (perItemA: number, perItemB: number) =>
        selectFarmNodes(
          { id: upgradeId("R"), count: 1 },
          new Map([
            [
              upgradeId("R"),
              {
                id: upgradeId("R"),
                farmLocations: [
                  location("RA", { effectiveRate: 1 / perItemA }),
                  location("RB", { effectiveRate: 1 / perItemB }),
                ],
              },
            ],
          ]),
          new Map([battle("RA", 1), battle("RB", 1)])
        )

      it("ties 33.331 and 33.334, keeping each real dropRate", () => {
        const nodes = pick(33.331, 33.334)
        expect(nodes.map((node) => node.battleId)).toEqual([
          battleId("RA"),
          battleId("RB"),
        ])
        expect(nodes[0]?.dropRate).toBeCloseTo(1 / 33.331, 10)
        expect(nodes[1]?.dropRate).toBeCloseTo(1 / 33.334, 10)
      })

      it("does not tie 33.33 and 33.34", () => {
        expect(pick(33.33, 33.34).map((node) => node.battleId)).toEqual([
          battleId("RA"),
        ])
      })
    })

    it("returns a restricted set as chosen, in catalog order", () => {
      const nodes = selectFarmNodes(
        { id: upgradeId("upgDmgC010"), count: 1 },
        tiedUpgrade(137, 151.5),
        tiedBattles,
        ["FoCE13", "SHME19"]
      )
      expect(nodes.map((node) => node.battleId)).toEqual([
        battleId("FoCE13"),
        battleId("SHME19"),
      ])
    })
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

  it("reports each goal's flat supply split by individual supplier (align-acquisition-source-yield-estimates)", () => {
    const shardId = shardResourceId("hero1")
    const goals: GoalNeed[] = [
      {
        goalId: "shard-goal",
        priority: 1,
        needs: [{ id: shardId, count: 40 }],
        flatSuppliers: [
          {
            key: "onslaught:regular",
            resourceId: shardId,
            supplyOnDay: () => 6,
          },
          {
            key: "guild:shards_hero1",
            resourceId: shardId,
            supplyOnDay: () => 9,
          },
        ],
      },
    ]

    const results = estimatePlan({
      goals,
      upgradesById: new Map(),
      battlesById: new Map(),
      dailyEnergy: 0,
      inventory: [],
      referenceDate: REFERENCE_DATE,
    })

    const outcome = results.get("shard-goal")
    if (outcome?.status !== "Estimated") throw new Error("expected an estimate")
    const bySupplier = outcome.flatSupplyBySupplier
    expect(bySupplier?.get("onslaught:regular")).toBeGreaterThan(0)
    expect(bySupplier?.get("guild:shards_hero1")).toBeGreaterThan(0)
    expect(
      (bySupplier?.get("onslaught:regular") ?? 0) +
        (bySupplier?.get("guild:shards_hero1") ?? 0)
    ).toBe(40)
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

  it("attributes contributed shards to each flat supplier separately when several feed one resource (align-acquisition-source-yield-estimates)", () => {
    const shardId = shardResourceId("hero1")
    const result = estimateGoal({
      needs: [{ id: shardId, count: 100 }],
      upgradesById: new Map(),
      battlesById: new Map(),
      dailyEnergy: 0,
      referenceDate: REFERENCE_DATE,
      flatSuppliers: [
        {
          key: "onslaught:regular",
          resourceId: shardId,
          supplyOnDay: () => 7,
        },
        {
          key: "guild:shards_hero1",
          resourceId: shardId,
          supplyOnDay: () => 10,
        },
      ],
    })

    if (result?.status !== "Estimated") throw new Error("expected an estimate")
    const bySupplier = result.flatSupplyBySupplier
    expect(bySupplier?.get("onslaught:regular")).toBeGreaterThan(0)
    expect(bySupplier?.get("guild:shards_hero1")).toBeGreaterThan(0)
    expect(
      (bySupplier?.get("onslaught:regular") ?? 0) +
        (bySupplier?.get("guild:shards_hero1") ?? 0)
    ).toBe(100)
    expect(result.flatSupplyTotal?.get(shardId)).toBe(100)
    expect(result.energyTotal).toBe(0)
    expect(result.raidsTotal).toBe(0)
  })

  it("attributes the same per-supplier totals regardless of supplier array order (align-acquisition-source-yield-estimates)", () => {
    const shardId = shardResourceId("hero1")
    const onslaught = {
      key: "onslaught:regular",
      resourceId: shardId,
      supplyOnDay: () => 7,
    }
    const shop = {
      key: "guild:shards_hero1",
      resourceId: shardId,
      supplyOnDay: () => 10,
    }
    const run = (flatSuppliers: (typeof onslaught)[]) =>
      estimateGoal({
        needs: [{ id: shardId, count: 53 }],
        upgradesById: new Map(),
        battlesById: new Map(),
        dailyEnergy: 0,
        referenceDate: REFERENCE_DATE,
        flatSuppliers,
      })

    const a = run([onslaught, shop])
    const b = run([shop, onslaught])
    if (a?.status !== "Estimated" || b?.status !== "Estimated") {
      throw new Error("expected estimates")
    }
    expect([...(a.flatSupplyBySupplier ?? [])].sort()).toEqual(
      [...(b.flatSupplyBySupplier ?? [])].sort()
    )
    expect(a.days).toBe(b.days)
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

describe("spendDay ordering (align-raid-spend-order-with-v1)", () => {
  const node = (
    id: string,
    energyCost: number,
    dailyAttempts = 999
  ): FarmNode => ({
    battleId: battleId(id),
    energyCost,
    dropRate: 1,
    dailyAttempts,
  })
  const run = (
    counts: [string, number][],
    nodes: [string, FarmNode][],
    startingEnergy: number,
    dailyEnergy = startingEnergy
  ) =>
    spendDay(
      new Map(counts.map(([id, n]) => [upgradeId(id), n])),
      new Map(nodes.map(([id, n]) => [upgradeId(id), [n]])),
      startingEnergy,
      dailyEnergy
    )

  it("farms a capped bottleneck material before a cheap one", () => {
    // A: 30 / 4 per day = 7.5 days; B: 30 / 10 per day = 3 days
    const { breakdown } = run(
      [
        ["B", 30],
        ["A", 30],
      ],
      [
        ["A", node("A1", 5, 4)],
        ["B", node("B1", 10)],
      ],
      100
    )
    expect(breakdown[0]).toMatchObject({
      resourceId: upgradeId("A"),
      raidsPerformed: 4,
      energySpent: 20,
    })
    expect(breakdown[1]?.resourceId).toBe(upgradeId("B"))
  })

  it("keeps the existing order when times to finish are equal", () => {
    // A: 5 / 10 per day = 0.5 days; B: 10 / 20 per day = 0.5 days. Cheapest-first would put B first.
    const { breakdown } = run(
      [
        ["A", 5],
        ["B", 10],
      ],
      [
        ["A", node("A1", 10)],
        ["B", node("B1", 5)],
      ],
      100
    )
    expect(breakdown.map((entry) => entry.resourceId)).toEqual([
      upgradeId("A"),
      upgradeId("B"),
    ])
  })

  it("sorts a zero-yield material first", () => {
    // Daily budget 50 can't afford Z's 60-energy node (yield 0 -> Infinity days), but the
    // remaining energy today (100) can.
    const { breakdown } = run(
      [
        ["B", 100],
        ["Z", 5],
      ],
      [
        ["B", node("B1", 10)],
        ["Z", node("Z1", 60)],
      ],
      100,
      50
    )
    expect(breakdown[0]?.resourceId).toBe(upgradeId("Z"))
  })

  it("finishes a Neurothrope-like goal in 3 days, not the 4 cheapest-first takes", () => {
    // Cheap uncapped C (120 raids x 5 = 600 energy) plus two capped expensive materials
    // (12 items each, 30 energy, 4 attempts/day = 3 days). At 538/day cheapest-first burns day 1
    // on C and needs a 4th day for the capped nodes; bottleneck-first starts them on day 1.
    const upgradesById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>(
      ["C", "K1", "K2"].map((id) => [
        upgradeId(id),
        {
          id: upgradeId(id),
          farmLocations: [location(`${id}-node`, { guaranteed: true })],
        },
      ])
    )
    const result = estimateGoal({
      needs: [
        { id: upgradeId("C"), count: 120 },
        { id: upgradeId("K1"), count: 12 },
        { id: upgradeId("K2"), count: 12 },
      ],
      upgradesById,
      battlesById: new Map([
        battle("C-node", 5),
        battle("K1-node", 30, 4),
        battle("K2-node", 30, 4),
      ]),
      dailyEnergy: 538,
      referenceDate: REFERENCE_DATE,
    })
    expect(result?.days).toBe(3)
  })

  it("raids two tied 6-raid nodes the same day, higher gold first, doubling day-1 yield", () => {
    const mk = (id: string, gold: number): FarmNode => ({
      battleId: battleId(id),
      energyCost: 10,
      dropRate: 0.43,
      dailyAttempts: 6,
      expectedGold: gold,
    })
    const day1 = (nodes: FarmNode[]) =>
      spendDay(
        new Map([[upgradeId("M"), 10]]),
        new Map([[upgradeId("M"), nodes]]),
        538,
        538
      )
    const one = day1([mk("N1", 151.5)])
    const two = day1([mk("N1", 151.5), mk("N2", 137)])
    expect(two.breakdown.map((e) => e.battleId)).toEqual([
      battleId("N1"),
      battleId("N2"),
    ])
    expect(two.breakdown.map((e) => e.raidsPerformed)).toEqual([6, 6])
    const farmed = (r: typeof one) =>
      r.breakdown.reduce((sum, e) => sum + e.itemsFarmed, 0)
    expect(farmed(two)).toBeCloseTo(2 * farmed(one), 10)
  })

  it("finishes a Neurothrope-like goal sooner with two tied nodes than one", () => {
    // M needs 24 items from tied 30-energy nodes capped at 4 raids/day each; K (capped) and C
    // (cheap, uncapped) compete for the same 538 energy/day.
    const run = (mNodes: string[]) =>
      estimateGoal({
        needs: [
          { id: upgradeId("C"), count: 100 },
          { id: upgradeId("K"), count: 12 },
          { id: upgradeId("M"), count: 24 },
        ],
        upgradesById: new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
          [
            upgradeId("C"),
            {
              id: upgradeId("C"),
              farmLocations: [location("C-node", { guaranteed: true })],
            },
          ],
          [
            upgradeId("K"),
            {
              id: upgradeId("K"),
              farmLocations: [location("K-node", { guaranteed: true })],
            },
          ],
          [
            upgradeId("M"),
            {
              id: upgradeId("M"),
              farmLocations: mNodes.map((id) =>
                location(id, { guaranteed: true })
              ),
            },
          ],
        ]),
        battlesById: new Map([
          battle("C-node", 5),
          battle("K-node", 30, 4),
          battle("M1", 30, 4),
          battle("M2", 30, 4),
        ]),
        dailyEnergy: 538,
        referenceDate: REFERENCE_DATE,
      })
    const single = run(["M1"])
    const tied = run(["M1", "M2"])
    expect(tied?.days).toBeLessThan(single?.days ?? Infinity)
    expect(tied?.days).toBe(3)
    expect(single?.days).toBe(6)
  })
})
