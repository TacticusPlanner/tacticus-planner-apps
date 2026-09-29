import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import { filterUnlockedBattles } from "@/shared/lib"

import type {
  Battle,
  EstimateUpgrade,
  FarmLocation,
} from "../model/estimate.domain"
import { estimateGoal } from "./estimate"
import { estimatePlan, estimateTodaySchedule } from "./estimate-plan"
import { projectOnslaughtSupply } from "./shop-supply"

// goals-overview-v1-parity 8.5: campaign farming considers only unlocked nodes. The shared battle
// map is filtered by synced campaign progress (`filterUnlockedBattles`); every estimate entry point
// then sees the same set.

const U = upgradeIdSchema.parse("U1")
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

const battle = (battleIndex: number, energyCost: number): Battle => ({
  campaignGroupId: campaignIdSchema.parse("campaign1"),
  type: "Normal",
  challenge: false,
  nodeNumber: battleIndex + 1,
  battleIndex,
  energyCost,
  dailyAttempts: 999,
})

// Node "far" (index 5) is the cheapest, "near" (index 1) costs more.
const all = new Map([
  [battleId("far"), battle(5, 5)],
  [battleId("near"), battle(1, 10)],
])
const upgradesById = new Map<typeof U, EstimateUpgrade>([
  [U, { id: U, farmLocations: [location("far"), location("near")] }],
])
const progress = (highestCompletedBattleIndex: number) => [
  {
    tacticusCampaignId: "campaign1",
    type: "Normal",
    highestCompletedBattleIndex,
  },
]
const unlocked = (highest: number) =>
  filterUnlockedBattles(all, progress(highest), new Set())
const base = {
  needs: [{ id: U, count: 10 }],
  upgradesById,
  dailyEnergy: 1000,
  referenceDate,
}

describe("filterUnlockedBattles", () => {
  it("unlocks up to the high-water mark + 1, and only index 0 with no progress", () => {
    expect([...unlocked(-1).keys()]).toEqual([])
    expect([...unlocked(0).keys()]).toEqual(["near"])
    expect([...unlocked(3).keys()]).toEqual(["near"])
    expect([...unlocked(4).keys()]).toEqual(["far", "near"])
    expect([...filterUnlockedBattles(all, [], new Set()).keys()]).toEqual([])
  })

  it("does not gate event campaigns", () => {
    const events = new Set(["campaign1"])
    expect(filterUnlockedBattles(all, [], events).size).toBe(2)
  })
})

describe("campaign farming considers only unlocked nodes", () => {
  it("ignores a cheaper locked node and prices the unlocked one", () => {
    const open = estimateGoal({ ...base, battlesById: unlocked(4) })
    const locked = estimateGoal({ ...base, battlesById: unlocked(1) })
    expect(open).toMatchObject({ energyTotal: 50 }) // far: 10 raids x 5
    expect(locked).toMatchObject({ energyTotal: 100 }) // near: 10 raids x 10
  })

  it("is blocked for lack of a farm location when no node is unlocked", () => {
    const outcome = estimateGoal({ ...base, battlesById: unlocked(-1) })
    expect(outcome).toMatchObject({
      status: "Blocked",
      reason: "NoFarmLocation",
    })
  })

  it("keeps a goal's pinned locations limited to the unlocked ones", () => {
    const outcome = estimateGoal({
      ...base,
      battlesById: unlocked(1),
      farmingLocationIds: ["far"],
    })
    expect(outcome).toMatchObject({
      status: "Blocked",
      reason: "FarmingOverrideUnavailable",
    })
  })

  it("agrees between the isolated estimate, the plan and today's raids", () => {
    const battlesById = unlocked(1)
    const goalOutcome = estimateGoal({ ...base, battlesById })
    const plan = estimatePlan({
      goals: [{ goalId: "g", priority: 1, needs: base.needs }],
      upgradesById,
      battlesById,
      dailyEnergy: 1000,
      inventory: [],
      referenceDate,
    })
    const today = estimateTodaySchedule({
      goals: [{ goalId: "g", priority: 1, needs: base.needs }],
      upgradesById,
      battlesById,
      dailyEnergy: 1000,
      inventory: [],
      referenceDate,
    })
    expect(plan.get("g")).toMatchObject({ energyTotal: 100 })
    expect(goalOutcome).toMatchObject({ energyTotal: 100 })
    expect(today.entries.map((entry) => entry.battleId)).toEqual(["near"])
  })
})

describe("projected Onslaught tokens", () => {
  const supplier = projectOnslaughtSupply({
    entityId: "toth",
    isMythic: false,
    avgShardsPerRun: 5.4,
    runsPerDay: 1.5,
  })
  const shardId = supplier.resourceId
  const shardUpgrades = new Map([
    [shardId, { id: shardId, farmLocations: [location("near")] }],
  ])

  it("is tokens = ceil(supplied shards / shards per run), with no energy for an Onslaught-only goal", () => {
    const outcome = estimateGoal({
      needs: [{ id: shardId, count: 161 }],
      upgradesById: new Map(),
      battlesById: new Map(),
      dailyEnergy: 1000,
      flatSuppliers: [supplier],
      referenceDate,
    })
    expect(outcome).toMatchObject({
      status: "Estimated",
      energyTotal: 0,
      onslaughtTokens: Math.ceil(161 / 5.4),
    })
  })

  it("splits a mixed goal into campaign energy and Onslaught tokens, in plan and isolated estimates", () => {
    const params = {
      needs: [{ id: shardId, count: 100 }],
      upgradesById: shardUpgrades,
      battlesById: unlocked(4),
      dailyEnergy: 100,
      referenceDate,
    }
    const isolated = estimateGoal({ ...params, flatSuppliers: [supplier] })
    const plan = estimatePlan({
      goals: [
        {
          goalId: "g",
          priority: 1,
          needs: params.needs,
          flatSuppliers: [supplier],
        },
      ],
      upgradesById: shardUpgrades,
      battlesById: params.battlesById,
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    }).get("g")
    for (const outcome of [isolated, plan]) {
      expect(outcome).toMatchObject({ status: "Estimated" })
      expect(outcome?.energyTotal).toBeGreaterThan(0)
      expect(
        (outcome as { onslaughtTokens?: number }).onslaughtTokens
      ).toBeGreaterThan(0)
    }
    expect((plan as { onslaughtTokens?: number }).onslaughtTokens).toBe(
      (isolated as { onslaughtTokens?: number }).onslaughtTokens
    )
  })

  it("is 0 without an Onslaught source", () => {
    const outcome = estimateGoal({ ...base, battlesById: unlocked(4) })
    expect(outcome).toMatchObject({ onslaughtTokens: 0 })
  })
})
