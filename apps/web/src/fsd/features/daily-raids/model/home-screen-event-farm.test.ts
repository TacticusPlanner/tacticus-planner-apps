import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
  type BattleId,
} from "@workspace/game-domain"

import type {
  EstimateResourceId,
  EstimateUpgrade,
  GoalNeed,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

import {
  planEventFarm,
  type PlanEventFarmInput,
} from "./home-screen-event-farm"

const battle = battleIdSchema.parse
const upgrade = upgradeIdSchema.parse

const node = (energyCost: number, dailyAttempts = 999): Battle => ({
  campaignGroupId: campaignIdSchema.parse("CG1"),
  type: "Normal",
  challenge: false,
  nodeNumber: 1,
  battleIndex: 0,
  energyCost,
  dailyAttempts,
})
const upgradeFarmedAt = (
  id: string,
  ...locations: (string | [string, number])[]
): [EstimateResourceId, EstimateUpgrade] => [
  upgrade(id),
  {
    id: upgrade(id),
    farmLocations: locations.map((entry) => {
      const [battleId, rate] = typeof entry === "string" ? [entry, null] : entry
      return {
        battleId: battle(battleId),
        guaranteed: rate === null,
        effectiveRate: rate,
        numerator: null,
        denominator: null,
        isMythic: false,
      }
    }),
  },
]
const goal = (
  goalId: string,
  priority: number,
  needs: Record<string, number>,
  extra: Partial<GoalNeed> = {}
): GoalNeed => ({
  goalId,
  priority,
  needs: Object.entries(needs).map(([id, count]) => ({
    id: upgrade(id),
    count,
  })),
  ...extra,
})

// matA: CHEAP (5 energy, no points) is the efficient node; PTS6 (6 energy) and PTS10 (10) earn points.
// The points nodes have 3 daily attempts so a list stays several rows long.
// matB: only at PTS6b. matC: only at ZERO (no points). matD: only at a locked/unlisted battle.
const battles = new Map<BattleId, Battle>([
  [battle("CHEAP"), node(5)],
  [battle("PTS6"), node(6, 3)],
  [battle("PTS10"), node(10, 3)],
  [battle("PTS6b"), node(6, 3)],
  [battle("ZERO"), node(5)],
])
const upgradesById = new Map<EstimateResourceId, EstimateUpgrade>([
  upgradeFarmedAt("matA", "CHEAP", "PTS6", "PTS10"),
  upgradeFarmedAt("matB", "PTS6b"),
  upgradeFarmedAt("matC", "ZERO"),
  upgradeFarmedAt("matD", "LOCKED"),
  upgradeFarmedAt("matHalf", ["PTS6", 0.5]),
])
const points = new Map<BattleId, number>([
  [battle("PTS6"), 12],
  [battle("PTS10"), 15],
  [battle("PTS6b"), 6],
])

const plan = (overrides: Partial<PlanEventFarmInput> = {}) =>
  planEventFarm({
    goals: [goal("g1", 1, { matA: 100 })],
    inventory: [],
    upgradesById,
    battlesById: battles,
    pointsByBattleId: points,
    attemptsLeftByBattle: new Map(),
    energyBudget: 1000,
    ...overrides,
  })
const ids = (farm: ReturnType<typeof plan>) =>
  farm.rows.map((row) => row.battleId as string)

describe("planEventFarm candidates", () => {
  it("is empty with no goals", () => {
    expect(plan({ goals: [] })).toMatchObject({ rows: [], empty: "no-goals" })
  })

  it("lists only point-earning locations, choosing a pricier node over the cheaper one without points (filter-then-pick)", () => {
    const farm = plan()
    expect(ids(farm)).toEqual(["PTS6", "PTS10"])
    expect(ids(farm)).not.toContain("CHEAP")
  })

  it("excludes locations that drop nothing any goal needs", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matC: 5 })],
      pointsByBattleId: new Map([[battle("ZERO"), 0]]),
    })
    expect(farm).toMatchObject({ rows: [], empty: "nothing-contributes" })
    expect(
      plan({ goals: [goal("g1", 1, { matB: 5 })] }).rows.map((r) => r.battleId)
    ).toEqual(["PTS6b"])
    // PTS6 earns points but drops only matA / matHalf, which nobody needs.
    expect(ids(plan({ goals: [goal("g1", 1, { matB: 5 })] }))).not.toContain(
      "PTS6"
    )
  })

  it("excludes a node that is not eligible (not in the battle map)", () => {
    expect(plan({ goals: [goal("g1", 1, { matD: 5 })] }).empty).toBe(
      "nothing-contributes"
    )
  })

  it("excludes a need already met by inventory", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matA: 10 })],
      inventory: [{ id: upgrade("matA"), count: 10 }],
    })
    expect(farm.empty).toBe("nothing-contributes")
  })

  it("excludes a location with no attempts left, and caps raids at the attempts left", () => {
    const exhausted = plan({
      attemptsLeftByBattle: new Map([
        [battle("PTS6"), 0],
        [battle("PTS10"), 0],
      ]),
    })
    expect(exhausted.empty).toBe("nothing-contributes")
    const one = plan({
      attemptsLeftByBattle: new Map([[battle("PTS6"), 1]]),
      energyBudget: 100,
    })
    expect(one.rows.find((r) => r.battleId === battle("PTS6"))?.raids).toBe(1)
  })

  it("uses a goal's pinned locations only", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matA: 100 }, { farmingLocationIds: ["PTS10"] })],
    })
    expect(ids(farm)).toEqual(["PTS10"])
    expect(farm.rows[0]!.goalIds).toEqual(["g1"])
  })

  it("counts a later-stage need anywhere in the schedule", () => {
    const staged = goal(
      "g1",
      1,
      {},
      {
        stages: [
          { target: "first", needs: [{ id: upgrade("matC"), count: 3 }] },
          { target: "second", needs: [{ id: upgrade("matB"), count: 4 }] },
        ],
      }
    )
    expect(ids(plan({ goals: [staged] }))).toEqual(["PTS6b"])
  })

  it("reports the goals a location serves, in priority order, without goals that need nothing there", () => {
    const farm = plan({
      goals: [
        goal("late", 5, { matA: 10 }),
        goal("early", 1, { matA: 10 }),
        goal("other", 2, { matB: 10 }),
      ],
    })
    expect(
      farm.rows.find((r) => r.battleId === battle("PTS6"))?.goalIds
    ).toEqual(["early", "late"])
    expect(
      farm.rows.find((r) => r.battleId === battle("PTS6b"))?.goalIds
    ).toEqual(["other"])
  })
})

describe("planEventFarm ordering and fill", () => {
  it("orders by points per energy, then points per raid, then goal priority, then battle id", () => {
    // PTS6: 12/6 = 2, PTS10: 15/10 = 1.5, PTS6b: 6/6 = 1.
    const farm = plan({
      goals: [goal("g1", 1, { matA: 100, matB: 100 })],
    })
    expect(ids(farm)).toEqual(["PTS6", "PTS10", "PTS6b"])

    const tie = plan({
      goals: [goal("g1", 1, { matA: 100 }), goal("g2", 2, { matB: 100 })],
      pointsByBattleId: new Map([
        [battle("PTS6"), 6],
        [battle("PTS10"), 10],
        [battle("PTS6b"), 6],
      ]),
    })
    // PTS6 and PTS6b tie at ratio 1 with equal points; PTS10 (10/10 = 1) has more points per raid.
    expect(ids(tie)).toEqual(["PTS10", "PTS6", "PTS6b"])

    const byPriority = plan({
      goals: [goal("late", 9, { matA: 100 }), goal("early", 1, { matB: 100 })],
      pointsByBattleId: new Map([
        [battle("PTS6"), 6],
        [battle("PTS6b"), 6],
      ]),
    })
    expect(ids(byPriority)).toEqual(["PTS6b", "PTS6"])

    const byId = plan({
      goals: [goal("g1", 1, { matA: 100, matB: 100 })],
      pointsByBattleId: new Map([
        [battle("PTS6"), 6],
        [battle("PTS6b"), 6],
      ]),
    })
    expect(ids(byId)).toEqual(["PTS6", "PTS6b"])
  })

  it("fills until the budget is used and never exceeds it", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matA: 100, matB: 100 })],
      energyBudget: 20,
    })
    // PTS6 first: floor(20 / 6) = 3 raids (18 energy); nothing else fits in the 2 left.
    expect(farm.rows).toHaveLength(1)
    expect(farm.rows[0]).toMatchObject({
      battleId: "PTS6",
      raids: 3,
      points: 36,
      energy: 18,
    })
    expect(farm.totalPoints).toBe(36)
    expect(farm.totalEnergy).toBe(18)
    expect(farm.totalEnergy).toBeLessThanOrEqual(farm.energyBudget)
  })

  it("skips a location that does not fit and still lists a later cheaper one", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matA: 100 })],
      pointsByBattleId: new Map([
        [battle("PTS10"), 40],
        [battle("PTS6"), 6],
      ]),
      energyBudget: 8,
    })
    expect(ids(farm)).toEqual(["PTS6"])
    expect(farm.rows[0]!.raids).toBe(1)
  })

  it("caps raids by the remaining need, converting through the drop rate", () => {
    // matHalf drops at 0.5 per raid at PTS6: 3 needed means 6 raids.
    const farm = plan({
      goals: [goal("g1", 1, { matHalf: 3 })],
      attemptsLeftByBattle: new Map([[battle("PTS6"), 999]]),
    })
    expect(farm.rows[0]).toMatchObject({ battleId: "PTS6", raids: 6 })
    const tiny = plan({ goals: [goal("g1", 1, { matA: 2 })] })
    expect(tiny.rows[0]!.raids).toBe(2)
  })

  it("shares the need between two locations dropping the same resource", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matA: 5 })],
      attemptsLeftByBattle: new Map([[battle("PTS6"), 999]]),
    })
    // PTS6 (best ratio) farms all 5; PTS10 has nothing left to contribute.
    expect(ids(farm)).toEqual(["PTS6"])
    expect(farm.rows[0]!.raids).toBe(5)
    const wide = plan({
      goals: [goal("g1", 1, { matA: 5 })],
      attemptsLeftByBattle: new Map([[battle("PTS6"), 3]]),
    })
    expect(wide.rows.map((r) => [r.battleId, r.raids])).toEqual([
      ["PTS6", 3],
      ["PTS10", 2],
    ])
  })

  it("is empty with no energy, also when less is left than any location costs", () => {
    expect(plan({ energyBudget: 0 }).empty).toBe("no-energy")
    expect(plan({ energyBudget: -4 }).empty).toBe("no-energy")
    expect(plan({ energyBudget: 5 })).toMatchObject({
      rows: [],
      empty: "no-energy",
    })
  })

  it("reports the drop shown on the row", () => {
    const farm = plan({ goals: [goal("g1", 1, { matA: 10 })] })
    expect(farm.rows[0]!.resourceId).toBe("matA")
  })
})

describe("planEventFarm with Raids Filters", () => {
  it("treats the filter as a candidate rule, picking among the passing nodes", () => {
    const farm = plan({
      nodeFilter: (battleId) => battleId !== battle("PTS6"),
    })
    expect(ids(farm)).toEqual(["PTS10"])
  })

  it("passes the dropped resource to the filter (rarity criterion)", () => {
    const farm = plan({
      goals: [goal("g1", 1, { matA: 10, matB: 10 })],
      nodeFilter: (_battleId, resourceId) => resourceId === upgrade("matB"),
    })
    expect(ids(farm)).toEqual(["PTS6b"])
  })

  it("says the filter is why the list is empty only when candidates exist without it", () => {
    expect(plan({ nodeFilter: () => false })).toMatchObject({
      rows: [],
      empty: "filtered",
    })
    expect(
      plan({
        goals: [goal("g1", 1, { matC: 5 })],
        nodeFilter: () => false,
      }).empty
    ).toBe("nothing-contributes")
  })
})

describe("planEventFarm order and quick filters", () => {
  it("energy order puts the cheapest location per item first, ahead of more points per energy", () => {
    const input = {
      battlesById: new Map<BattleId, Battle>([
        [battle("SURE"), node(10, 3)],
        [battle("HALF"), node(6, 3)],
      ]),
      // SURE: 10 energy per item; HALF: 12 energy per item but 2 points per energy.
      upgradesById: new Map<EstimateResourceId, EstimateUpgrade>([
        upgradeFarmedAt("matM", "SURE", ["HALF", 0.5]),
      ]),
      pointsByBattleId: new Map<BattleId, number>([
        [battle("SURE"), 10],
        [battle("HALF"), 12],
      ]),
      goals: [goal("g1", 1, { matM: 10 })],
    }
    expect(ids(plan(input))).toEqual(["HALF", "SURE"])
    const farm = plan({ ...input, order: "energy" })
    expect(ids(farm)).toEqual(["SURE", "HALF"])
    expect(farm.rows.map((row) => row.energyPerItem)).toEqual([10, 12])
  })

  it("energy order rates a location against the cheapest one, with or without points", () => {
    // matA: CHEAP (5, no points) is the cheapest, so PTS6 (1.2x) comes before PTS10 (2x).
    expect(ids(plan({ order: "energy" }))).toEqual(["PTS6", "PTS10"])
  })

  it("energy order still serves a goal from its pinned locations", () => {
    const farm = plan({
      order: "energy",
      goals: [goal("g1", 1, { matA: 5 }, { farmingLocationIds: ["PTS10"] })],
    })
    expect(ids(farm)).toEqual(["PTS10"])
  })

  it("Fewer raids puts the costliest battle first among locations tied on energy per item", () => {
    const tied = {
      battlesById: new Map<BattleId, Battle>([
        [battle("E5"), node(5, 1)],
        [battle("E10"), node(10, 1)],
      ]),
      upgradesById: new Map<EstimateResourceId, EstimateUpgrade>([
        upgradeFarmedAt("matE", ["E5", 1], ["E10", 2]),
      ]),
      // Both cost 5 energy per item; E5 earns more points per energy.
      pointsByBattleId: new Map<BattleId, number>([
        [battle("E5"), 6],
        [battle("E10"), 10],
      ]),
      goals: [goal("g1", 1, { matE: 4 })],
      order: "energy" as const,
    }
    expect(ids(plan(tied))).toEqual(["E5", "E10"])
    expect(ids(plan({ ...tied, fewerRaids: true }))).toEqual(["E10", "E5"])
  })

  it("Combine goals drops goal priority from the tie-break", () => {
    const input = {
      battlesById: new Map<BattleId, Battle>([
        [battle("A6"), node(6)],
        [battle("Z6"), node(6)],
      ]),
      upgradesById: new Map<EstimateResourceId, EstimateUpgrade>([
        upgradeFarmedAt("matG", "A6"),
        upgradeFarmedAt("matH", "Z6"),
      ]),
      pointsByBattleId: new Map<BattleId, number>([
        [battle("A6"), 6],
        [battle("Z6"), 6],
      ]),
      goals: [goal("g1", 2, { matG: 1 }), goal("g2", 1, { matH: 1 })],
    }
    expect(ids(plan(input))).toEqual(["Z6", "A6"])
    expect(ids(plan({ ...input, combineGoals: true }))).toEqual(["A6", "Z6"])
  })

  it("is not capped by energy when the budget is unlimited", () => {
    const farm = plan({ energyBudget: Infinity })
    expect(
      farm.rows.reduce((total, row) => total + row.raids, 0)
    ).toBeGreaterThan(0)
    expect(farm.empty).toBeNull()
  })
})
