import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateOutcome,
  EstimateResourceId,
  EstimateUpgrade,
  FarmNode,
  GoalNeed,
  RaidBreakdownEntry,
  RaidDaySchedule,
  RaidPlanSchedule,
  UpgradeNeed,
} from "../model/estimate.domain"
import { blocked, unavailableReason } from "./estimate-blocked"
import {
  allocatePlanInventory,
  formatDate,
  inclusiveCompletionDate,
  selectFarmNodes,
  spendDay,
} from "./estimate"

const MAX_DAYS = 1000
const UNUSED_ENERGY_THRESHOLD = 60

export type EstimatePlanParams = {
  goals: GoalNeed[]
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  dailyEnergy: number
  inventory: UpgradeNeed[]
  referenceDate?: Date
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
  }: EstimatePlanParams,
  maxDays: number
): RaidPlanSchedule {
  const ordered = [...goals].sort((a, b) => a.priority - b.priority)
  const allocations = allocatePlanInventory(ordered, inventory)
  const stagesByGoal = new Map<string, StageState[]>()
  const results = new Map<string, EstimateOutcome>()

  for (const goal of ordered) {
    const stages: StageState[] = []
    let blockedOutcome: EstimateOutcome | null = null
    const allocation = allocations.get(goal.goalId)
    for (const sourceStage of allocation?.stages ?? []) {
      const remaining = new Map<EstimateResourceId, number>()
      const nodesById = new Map<EstimateResourceId, FarmNode[]>()
      for (const need of sourceStage.remaining) {
        const unavailable = unavailableReason(
          need,
          upgradesById,
          battlesById,
          goal.farmingLocationIds,
          dailyEnergy
        )
        if (unavailable) {
          blockedOutcome = blocked(unavailable, [need.id])
          break
        }
        const nodes = selectFarmNodes(
          need,
          upgradesById,
          battlesById,
          goal.farmingLocationIds
        )
        if (nodes.length === 0) {
          blockedOutcome = blocked("NoFarmLocation", [need.id])
          break
        }
        remaining.set(need.id, need.count)
        nodesById.set(need.id, nodes)
      }
      if (blockedOutcome) break
      if (remaining.size > 0) stages.push({ remaining, nodesById })
    }

    if (blockedOutcome) {
      results.set(goal.goalId, blockedOutcome)
    } else if (stages.length === 0) {
      results.set(goal.goalId, {
        status: "Estimated",
        days: 0,
        date: formatDate(referenceDate),
        energyTotal: 0,
        raidsTotal: 0,
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
  const scheduleDays: RaidDaySchedule[] = []

  while (pending.size > 0 && days < maxDays) {
    days++
    let energy = dailyEnergy
    const attemptsUsedByBattle = new Map<BattleId, number>()
    const entries: RaidBreakdownEntry[] = []

    for (const goal of ordered) {
      if (!pending.has(goal.goalId) || energy <= 0) continue
      const stages = stagesByGoal.get(goal.goalId)!
      let goalEnergySpent = 0
      let goalRaids = 0
      while (stages.length > 0 && energy > 0) {
        const stage = stages[0]!
        const spent = spendDay(
          stage.remaining,
          stage.nodesById,
          energy,
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
        results.set(goal.goalId, {
          status: "Estimated",
          days,
          date: formatDate(inclusiveCompletionDate(referenceDate, days)),
          energyTotal: energyTotalByGoal.get(goal.goalId) ?? 0,
          raidsTotal: raidsTotalByGoal.get(goal.goalId) ?? 0,
        })
        pending.delete(goal.goalId)
      }
    }

    scheduleDays.push({
      day: days,
      entries,
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
    days: scheduleDays,
    outcomes: results,
    summary: {
      totalDays: scheduleDays.length,
      totalEnergy,
      totalRaids,
      daysWithUnusedEnergy: scheduleDays.filter(
        (day) => dailyEnergy - day.energyTotal > UNUSED_ENERGY_THRESHOLD
      ).length,
      completionDate: formatDate(
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

export function estimateTodaySchedule(
  params: EstimatePlanParams
): RaidDaySchedule {
  return (
    runPlanSchedule(params, 1).days[0] ?? {
      day: 1,
      entries: [],
      attemptsUsedByBattle: new Map<BattleId, number>(),
      energyTotal: 0,
      raidsTotal: 0,
    }
  )
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
