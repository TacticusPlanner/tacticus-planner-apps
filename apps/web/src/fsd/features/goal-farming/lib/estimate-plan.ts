import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateBlocker,
  EstimateOutcome,
  EstimateResourceId,
  EstimateUpgrade,
  FarmNode,
  FarmNodeFilter,
  FilteredOutNeed,
  GoalNeed,
  RaidBreakdownEntry,
  RaidDaySchedule,
  OnslaughtScheduleEntry,
  RaidPlanSchedule,
  ShopScheduleEntry,
  UpgradeNeed,
} from "../model/estimate.domain"
import { blocked, partiallyBlocked } from "./estimate-blocked"
import {
  allocatePlanInventory,
  applyFlatSuppliers,
  classifyNeed,
  formatDate,
  inclusiveCompletionDate,
  shopSpendField,
  spendDay,
} from "./estimate"
import { onslaughtTokensFromSupply } from "./shop-supply"

const MAX_DAYS = 1000
const UNUSED_ENERGY_THRESHOLD = 60

export type EstimatePlanParams = {
  goals: GoalNeed[]
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  dailyEnergy: number
  inventory: UpgradeNeed[]
  referenceDate?: Date
  /** Restricts the farm nodes picked per material (Raids Filters). Only Today and Bonus Raids pass
   *  it; every other caller of this engine stays unfiltered. */
  nodeFilter?: FarmNodeFilter
}

type StageState = {
  remaining: Map<EstimateResourceId, number>
  nodesById: Map<EstimateResourceId, FarmNode[]>
}

function runPlanSchedule(
  {
    goals,
    upgradesById,
    battlesById,
    dailyEnergy,
    inventory,
    referenceDate = new Date(),
    nodeFilter,
  }: EstimatePlanParams,
  maxDays: number
): RaidPlanSchedule & { filteredOut: FilteredOutNeed[] } {
  const ordered = [...goals].sort((a, b) => a.priority - b.priority)
  const allocations = allocatePlanInventory(ordered, inventory)
  const stagesByGoal = new Map<string, StageState[]>()
  const results = new Map<string, EstimateOutcome>()

  const filteredOut: FilteredOutNeed[] = []
  const blockersByGoal = new Map<string, EstimateBlocker[]>()
  const actionableByGoal = new Map<string, EstimateResourceId[]>()

  for (const goal of ordered) {
    const stages: StageState[] = []
    const blockers: EstimateBlocker[] = []
    const allocation = allocations.get(goal.goalId)
    const suppliedResourceIds = new Set(
      goal.flatSuppliers?.map((supplier) => supplier.resourceId)
    )
    // A blocked need is reported and left out of the stage; its actionable peers still schedule.
    for (const sourceStage of allocation?.stages ?? []) {
      const remaining = new Map<EstimateResourceId, number>()
      const nodesById = new Map<EstimateResourceId, FarmNode[]>()
      for (const need of sourceStage.remaining) {
        const { nodes, blocker, pinned } = classifyNeed(
          need,
          suppliedResourceIds.has(need.id),
          upgradesById,
          battlesById,
          goal.farmingLocationIds,
          dailyEnergy,
          nodeFilter
        )
        if (blocker) {
          blockers.push({
            resourceId: need.id,
            reason: blocker,
            remaining: need.count,
            ...(pinned ? { pinned } : {}),
          })
          if (blocker === "FilteredOut") {
            filteredOut.push({
              goalId: goal.goalId,
              resourceId: need.id,
              remaining: need.count,
              pinned: !!pinned,
            })
          }
          continue
        }
        remaining.set(need.id, need.count)
        nodesById.set(need.id, nodes)
      }
      if (remaining.size > 0) stages.push({ remaining, nodesById })
    }

    blockersByGoal.set(goal.goalId, blockers)
    actionableByGoal.set(
      goal.goalId,
      stages.flatMap((stage) => [...stage.remaining.keys()])
    )
    if (stages.length === 0 && blockers.length > 0) {
      results.set(goal.goalId, partiallyBlocked(blockers, []))
    } else if (stages.length === 0) {
      results.set(goal.goalId, {
        status: "Estimated",
        days: 0,
        date: formatDate(referenceDate),
        energyTotal: 0,
        raidsTotal: 0,
        flatSupplyTotal: new Map(),
        flatSupplyBySupplier: new Map(),
      })
    } else {
      stagesByGoal.set(goal.goalId, stages)
    }
  }

  let days = 0
  const pending = new Set(stagesByGoal.keys())
  const energyTotalByGoal = new Map<string, number>(
    [...pending].map((id) => [id, 0])
  )
  const raidsTotalByGoal = new Map<string, number>(
    [...pending].map((id) => [id, 0])
  )
  const flatSupplyTotalByGoal = new Map<
    string,
    Map<EstimateResourceId, number>
  >()
  const flatSupplyBySupplierByGoal = new Map<string, Map<string, number>>()
  const flatSuppliersByGoal = new Map(
    ordered.map((goal) => [goal.goalId, goal.flatSuppliers])
  )
  const scheduleDays: RaidDaySchedule[] = []

  while (pending.size > 0 && days < maxDays) {
    days++
    let energy = dailyEnergy
    const attemptsUsedByBattle = new Map<BattleId, number>()
    const entries: RaidBreakdownEntry[] = []
    const shopEntries: ShopScheduleEntry[] = []
    const onslaughtEntries: OnslaughtScheduleEntry[] = []

    for (const goal of ordered) {
      if (!pending.has(goal.goalId)) continue
      const stages = stagesByGoal.get(goal.goalId)!
      let goalEnergySpent = 0
      let goalRaids = 0

      // Flat suppliers (a shop offer, Onslaught) are energy-free — apply them to the goal's current
      // stage before spending the shared daily energy pool, and regardless of whether that pool is
      // already exhausted for the day (a lower-priority goal can still complete purely from its own
      // shop/Onslaught sources even with zero energy left).
      if (stages.length > 0) {
        const appliedToday = applyFlatSuppliers(
          stages[0]!.remaining,
          flatSuppliersByGoal.get(goal.goalId),
          days - 1
        )
        if (appliedToday.byResource.size > 0) {
          const goalTotals =
            flatSupplyTotalByGoal.get(goal.goalId) ??
            new Map<EstimateResourceId, number>()
          for (const [id, amount] of appliedToday.byResource) {
            goalTotals.set(id, (goalTotals.get(id) ?? 0) + amount)
          }
          flatSupplyTotalByGoal.set(goal.goalId, goalTotals)

          const goalBySupplier =
            flatSupplyBySupplierByGoal.get(goal.goalId) ??
            new Map<string, number>()
          for (const [key, amount] of appliedToday.bySupplier) {
            goalBySupplier.set(key, (goalBySupplier.get(key) ?? 0) + amount)
            if (amount <= 0) continue
            // Every flat supplier but Onslaught is a shop offer keyed by its `offerId`.
            if (!key.startsWith("onslaught:")) {
              shopEntries.push({
                goalId: goal.goalId,
                offerId: key,
                expectedShards: amount,
              })
              continue
            }
            const shardsPerRun = flatSuppliersByGoal
              .get(goal.goalId)
              ?.find((supplier) => supplier.key === key)?.shardsPerRun
            if (!shardsPerRun) continue
            const existing = onslaughtEntries.find(
              (entry) => entry.goalId === goal.goalId
            )
            if (existing) {
              existing.expectedShards += amount
              existing.runs += amount / shardsPerRun
            } else {
              onslaughtEntries.push({
                goalId: goal.goalId,
                expectedShards: amount,
                runs: amount / shardsPerRun,
              })
            }
          }
          flatSupplyBySupplierByGoal.set(goal.goalId, goalBySupplier)
        }
        while (stages.length > 0 && stages[0]!.remaining.size === 0) {
          stages.shift()
        }
      }

      while (stages.length > 0 && energy > 0) {
        const stage = stages[0]!
        const spent = spendDay(
          stage.remaining,
          stage.nodesById,
          energy,
          dailyEnergy,
          attemptsUsedByBattle
        )
        energy -= spent.energySpent
        goalEnergySpent += spent.energySpent
        goalRaids += spent.raidsPerformed
        entries.push(
          ...spent.breakdown.map((entry) => ({ goalId: goal.goalId, ...entry }))
        )
        if (stage.remaining.size > 0) break
        stages.shift()
      }
      energyTotalByGoal.set(
        goal.goalId,
        (energyTotalByGoal.get(goal.goalId) ?? 0) + goalEnergySpent
      )
      raidsTotalByGoal.set(
        goal.goalId,
        (raidsTotalByGoal.get(goal.goalId) ?? 0) + goalRaids
      )
      if (stages.length === 0) {
        const goalBlockers = blockersByGoal.get(goal.goalId) ?? []
        // Obtainable work is done; a remaining blocker means the goal never completes.
        results.set(
          goal.goalId,
          goalBlockers.length > 0
            ? partiallyBlocked(
                goalBlockers,
                actionableByGoal.get(goal.goalId) ?? []
              )
            : {
                status: "Estimated",
                days,
                date: formatDate(inclusiveCompletionDate(referenceDate, days)),
                energyTotal: energyTotalByGoal.get(goal.goalId) ?? 0,
                raidsTotal: raidsTotalByGoal.get(goal.goalId) ?? 0,
                flatSupplyTotal:
                  flatSupplyTotalByGoal.get(goal.goalId) ?? new Map(),
                flatSupplyBySupplier:
                  flatSupplyBySupplierByGoal.get(goal.goalId) ?? new Map(),
                onslaughtTokens: onslaughtTokensFromSupply(
                  flatSupplyBySupplierByGoal.get(goal.goalId) ?? new Map(),
                  goal.flatSuppliers
                ),
                ...shopSpendField(
                  flatSupplyBySupplierByGoal.get(goal.goalId) ?? new Map(),
                  goal.flatSuppliers
                ),
              }
        )
        pending.delete(goal.goalId)
      }
    }

    scheduleDays.push({
      day: days,
      entries,
      shopEntries,
      onslaughtEntries,
      attemptsUsedByBattle: new Map(attemptsUsedByBattle),
      energyTotal: dailyEnergy - energy,
      raidsTotal: entries.reduce(
        (total, entry) => total + entry.raidsPerformed,
        0
      ),
    })
  }

  for (const goalId of pending) {
    results.set(
      goalId,
      blocked("SimulationLimit", [
        ...(stagesByGoal
          .get(goalId)
          ?.flatMap((stage) => [...stage.remaining.keys()]) ?? []),
      ])
    )
  }

  const totalEnergy = scheduleDays.reduce(
    (total, day) => total + day.energyTotal,
    0
  )
  const totalRaids = scheduleDays.reduce(
    (total, day) => total + day.raidsTotal,
    0
  )
  return {
    filteredOut,
    days: scheduleDays,
    outcomes: results,
    summary: {
      totalDays: scheduleDays.length,
      totalEnergy,
      totalRaids,
      daysWithUnusedEnergy: scheduleDays.filter(
        (day) => dailyEnergy - day.energyTotal > UNUSED_ENERGY_THRESHOLD
      ).length,
      completionDate: [...results.values()].some(
        (outcome) => outcome.status === "Blocked"
      )
        ? null
        : formatDate(
            inclusiveCompletionDate(referenceDate, scheduleDays.length)
          ),
    },
  }
}

export function estimatePlanSchedule(
  params: EstimatePlanParams
): RaidPlanSchedule {
  return runPlanSchedule(params, MAX_DAYS)
}

export function estimatePlan(
  params: EstimatePlanParams
): ReadonlyMap<string, EstimateOutcome> {
  return estimatePlanSchedule(params).outcomes
}

/** Today's schedule plus the needs `params.nodeFilter` removed every preferred node of. */
export function estimateTodayRun(params: EstimatePlanParams): {
  today: RaidDaySchedule
  filteredOut: FilteredOutNeed[]
} {
  const run = runPlanSchedule(params, 1)
  return {
    today: run.days[0] ?? {
      day: 1,
      entries: [],
      attemptsUsedByBattle: new Map<BattleId, number>(),
      energyTotal: 0,
      raidsTotal: 0,
    },
    filteredOut: run.filteredOut,
  }
}

export function estimateTodaySchedule(
  params: EstimatePlanParams
): RaidDaySchedule {
  return estimateTodayRun(params).today
}

// Keep this sentinel finite: runPlanSchedule subtracts remaining energy from the daily budget,
// which would produce NaN if the budget were Infinity.
const UNLIMITED_DAILY_ENERGY = 88_888_888

export function estimateBonusRaids(
  params: EstimatePlanParams
): RaidDaySchedule {
  const real = estimateTodaySchedule(params)
  const unlimited = estimateTodaySchedule({
    ...params,
    dailyEnergy: UNLIMITED_DAILY_ENERGY,
  })
  const raidedResourceIds = new Set(
    real.entries.map((entry) => entry.resourceId)
  )
  const entries = unlimited.entries.filter(
    (entry) => !raidedResourceIds.has(entry.resourceId)
  )
  const attemptsUsedByBattle = new Map<BattleId, number>()
  for (const entry of entries) {
    attemptsUsedByBattle.set(
      entry.battleId,
      (attemptsUsedByBattle.get(entry.battleId) ?? 0) + entry.raidsPerformed
    )
  }
  return {
    ...unlimited,
    entries,
    attemptsUsedByBattle,
    energyTotal: entries.reduce((total, entry) => total + entry.energySpent, 0),
    raidsTotal: entries.reduce(
      (total, entry) => total + entry.raidsPerformed,
      0
    ),
  }
}
