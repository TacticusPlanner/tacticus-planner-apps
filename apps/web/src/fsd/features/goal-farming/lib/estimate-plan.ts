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
  /** The player's real attempts left today per node. Only `estimateRaidsLeftToday` passes it; it
   *  caps day 1's raids at each node to what is left (later days start fresh). */
  attemptsLeftByBattle?: ReadonlyMap<BattleId, number>
  /** Today quick filter "Fewer raids": among nodes tied on least energy per item, keep only the
   *  costliest per battle. Only Today and Bonus Raids pass it. */
  fewerRaids?: boolean
  /** Today quick filter "Bottlenecks": spend each day's energy on one pool of every goal's
   *  remaining need (all stages), longest-to-finish first, instead of goal by goal in priority
   *  order. Only Today and Bonus Raids pass it. */
  combineGoals?: boolean
}

type StageState = {
  remaining: Map<EstimateResourceId, number>
  nodesById: Map<EstimateResourceId, FarmNode[]>
}

/**
 * One day of the "Bottlenecks" quick filter: every pending goal's remaining need, summed per resource
 * across all its stages, is spent as one pool by `spendDay` (longest-to-finish resource first). A
 * resource is farmed at the nodes picked for the highest-priority goal that needs it; what it yields
 * is taken off the goals' stages in priority order, and each raid entry is credited to that same
 * highest-priority goal so Today keeps its per-goal grouping. Stages a day empties are dropped.
 */
function spendPooledDay(
  goals: readonly GoalNeed[],
  stagesByGoal: ReadonlyMap<string, StageState[]>,
  energy: number,
  dailyEnergy: number,
  attemptsUsedByBattle: Map<BattleId, number>,
  attemptsLeftByBattle: ReadonlyMap<BattleId, number> | undefined
): { energySpent: number; entries: RaidBreakdownEntry[] } {
  const pool = new Map<EstimateResourceId, number>()
  const nodesById = new Map<EstimateResourceId, FarmNode[]>()
  const ownerById = new Map<EstimateResourceId, string>()
  for (const goal of goals) {
    for (const stage of stagesByGoal.get(goal.goalId) ?? []) {
      for (const [id, count] of stage.remaining) {
        pool.set(id, (pool.get(id) ?? 0) + count)
        if (!ownerById.has(id)) {
          ownerById.set(id, goal.goalId)
          nodesById.set(id, stage.nodesById.get(id) ?? [])
        }
      }
    }
  }
  if (energy <= 0 || pool.size === 0) return { energySpent: 0, entries: [] }

  const before = new Map(pool)
  const spent = spendDay(
    pool,
    nodesById,
    energy,
    dailyEnergy,
    attemptsUsedByBattle,
    attemptsLeftByBattle
  )
  for (const [id, count] of before) {
    let farmed = count - (pool.get(id) ?? 0)
    for (const goal of goals) {
      if (farmed <= 0) break
      for (const stage of stagesByGoal.get(goal.goalId) ?? []) {
        const need = stage.remaining.get(id)
        if (!need) continue
        const taken = Math.min(need, farmed)
        farmed -= taken
        if (need - taken <= 0) stage.remaining.delete(id)
        else stage.remaining.set(id, need - taken)
        if (farmed <= 0) break
      }
    }
  }
  for (const goal of goals) {
    const stages = stagesByGoal.get(goal.goalId)
    if (!stages) continue
    const left = stages.filter((stage) => stage.remaining.size > 0)
    stages.splice(0, stages.length, ...left)
  }
  return {
    energySpent: spent.energySpent,
    entries: spent.breakdown.map((entry) => ({
      goalId: ownerById.get(entry.resourceId)!,
      ...entry,
    })),
  }
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
    attemptsLeftByBattle,
    fewerRaids = false,
    combineGoals = false,
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
          nodeFilter,
          fewerRaids
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

  const addGoalTotals = (
    goalId: string,
    energySpent: number,
    raids: number
  ) => {
    energyTotalByGoal.set(
      goalId,
      (energyTotalByGoal.get(goalId) ?? 0) + energySpent
    )
    raidsTotalByGoal.set(goalId, (raidsTotalByGoal.get(goalId) ?? 0) + raids)
  }
  const completeIfDone = (goal: GoalNeed) => {
    const stages = stagesByGoal.get(goal.goalId)!
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

  while (pending.size > 0 && days < maxDays) {
    days++
    let energy = dailyEnergy
    const attemptsUsedByBattle = new Map<BattleId, number>()
    // Shop offers' daily caps and Onslaught tokens are per account: goals draw on them in priority
    // order (spec: *A shop offer's daily capacity is shared across goals in priority order*, *Onslaught
    // tokens are shared across goals in priority order*).
    const dailySupplyUsed = new Map<string, number>()
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
          days - 1,
          dailySupplyUsed
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
                expectedAmount: amount,
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

      while (!combineGoals && stages.length > 0 && energy > 0) {
        const stage = stages[0]!
        const spent = spendDay(
          stage.remaining,
          stage.nodesById,
          energy,
          dailyEnergy,
          attemptsUsedByBattle,
          days === 1 ? attemptsLeftByBattle : undefined
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
      addGoalTotals(goal.goalId, goalEnergySpent, goalRaids)
      if (!combineGoals) completeIfDone(goal)
    }

    if (combineGoals) {
      const spent = spendPooledDay(
        ordered.filter((goal) => pending.has(goal.goalId)),
        stagesByGoal,
        energy,
        dailyEnergy,
        attemptsUsedByBattle,
        days === 1 ? attemptsLeftByBattle : undefined
      )
      energy -= spent.energySpent
      for (const entry of spent.entries) {
        addGoalTotals(entry.goalId, entry.energySpent, entry.raidsPerformed)
      }
      entries.push(...spent.entries)
      for (const goal of ordered) {
        if (pending.has(goal.goalId)) completeIfDone(goal)
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

  const isBlocked = (goalId: string) =>
    results.get(goalId)?.status === "Blocked"
  const excludedGoalIds = ordered
    .filter((goal) => goal.excludeFromCompletion && isBlocked(goal.goalId))
    .map((goal) => goal.goalId)
  // A date needs some goal behind it: one whose goals are all excluded would only date Today.
  const completes =
    (excludedGoalIds.length === 0 || excludedGoalIds.length < ordered.length) &&
    !ordered.some(
      (goal) => !goal.excludeFromCompletion && isBlocked(goal.goalId)
    )
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
      completionDate: completes
        ? formatDate(
            inclusiveCompletionDate(referenceDate, scheduleDays.length)
          )
        : null,
      excludedGoalIds,
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

/** Today's schedule plus the needs `params.nodeFilter` removed every farm node of. */
export function estimateTodayRun(params: EstimatePlanParams): {
  today: RaidDaySchedule
  filteredOut: FilteredOutNeed[]
} {
  const run = runPlanSchedule(params, 1)
  return {
    today: run.days[0] ?? {
      day: 1,
      entries: [],
      shopEntries: [],
      onslaughtEntries: [],
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
  return withEntries(
    unlimited,
    unlimited.entries.filter(
      (entry) => !raidedResourceIds.has(entry.resourceId)
    )
  )
}

/**
 * Every raid still open today once the daily energy limit is spent: today's schedule with unlimited
 * energy and each node capped at the player's real attempts left, so the plan's partly-raided
 * materials keep their remaining farming in goal-priority order (Bonus Raids after the limit).
 */
export function estimateRaidsLeftToday(
  params: EstimatePlanParams & {
    attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  }
): RaidDaySchedule {
  return estimateTodaySchedule({
    ...params,
    dailyEnergy: UNLIMITED_DAILY_ENERGY,
  })
}

/** `schedule` narrowed to `entries`, its attempt and energy totals recomputed from them. */
function withEntries(
  schedule: RaidDaySchedule,
  entries: RaidBreakdownEntry[]
): RaidDaySchedule {
  const attemptsUsedByBattle = new Map<BattleId, number>()
  for (const entry of entries) {
    attemptsUsedByBattle.set(
      entry.battleId,
      (attemptsUsedByBattle.get(entry.battleId) ?? 0) + entry.raidsPerformed
    )
  }
  return {
    ...schedule,
    entries,
    attemptsUsedByBattle,
    energyTotal: entries.reduce((total, entry) => total + entry.energySpent, 0),
    raidsTotal: entries.reduce(
      (total, entry) => total + entry.raidsPerformed,
      0
    ),
  }
}
