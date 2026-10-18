import type { BattleId } from "@workspace/game-domain"

import {
  allocatePlanInventory,
  collectFarmNodes,
  type EstimatePlanParams,
  type EstimateResourceId,
  type EstimateUpgrade,
  type GoalNeed,
  type RaidBreakdownEntry,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

/** What a campaign mission objective asks of the raid list (see hre-campaign-raids). */
export type MissionRaidsRequest = {
  /** Battles still needed for the current mission's objective. */
  battlesToGo: number
  /** Lightning victories: only event-campaign nodes count, so only they are suggested. */
  eventOnly: boolean
}

/** The best-priority goal a node feeds, for the tie-break among equal energy costs. */
export type MissionGoalNode = {
  priority: number
  goalIds: string[]
  resourceId: EstimateResourceId
}

type MissionRaidRow = {
  battleId: BattleId
  energyCost: number
  raids: number
  energy: number
  /** Set when the node drops a resource an in-scope goal still needs. */
  goal: MissionGoalNode | null
}

type MissionRaidsEmptyReason =
  | "plan-completes"
  | "no-energy"
  | "no-attempts"
  | "no-candidates"
  | "filtered"
  | "no-event"

export type MissionRaidPlan = {
  /** Remaining raids on Today's plan that count toward the objective. */
  plannedCount: number
  /** Battles left for suggestions after Today's plan. */
  battlesLeft: number
  /** Daily energy minus energy spent minus Today's remaining planned energy, never below 0. */
  energyBudget: number
  rows: MissionRaidRow[]
  totalRaids: number
  totalEnergy: number
  /** Battles still left once today's suggestions are done. */
  remainingAfter: number
  empty: MissionRaidsEmptyReason | null
  /** The cheapest raidable energy cost, ignoring today's attempts and plan and the lightning
   * restriction (null: no node). */
  cheapestEnergyCost: number | null
  /** Daily raid capacity of the nodes at that cheapest cost, from their caps. */
  cheapestDailyCapacity: number
}

export type MissionRaidBattle = Pick<Battle, "energyCost" | "dailyAttempts"> & {
  id: BattleId
  isEvent: boolean
}

export type PlanMissionRaidsInput = MissionRaidsRequest & {
  /** The battles the player can raid by campaign progress (event nodes only while their event runs). */
  battles: readonly MissionRaidBattle[]
  /** Synced attempts left today; a node absent here has its full daily cap. */
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  /** Raids Today still plans (not done yet) per node. */
  plannedByBattle: ReadonlyMap<BattleId, number>
  dailyEnergy: number
  realEnergyUsedToday: number
  goalNodesByBattle: ReadonlyMap<BattleId, MissionGoalNode>
  passesFilter: (battleId: BattleId) => boolean
}

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * Where to raid today so the current HRE mission's campaign objective finishes with the least
 * energy. Today's remaining planned raids count first and keep their energy and attempts; the rest
 * is filled over the eligible nodes in order of energy cost, then goal priority (a node feeding a
 * goal first), then battle id, each getting as many raids as its attempts, the budget and the
 * battles left allow. A node that does not fit is skipped, not a stop.
 */
export function planMissionRaids(
  input: PlanMissionRaidsInput
): MissionRaidPlan {
  const byId = new Map(input.battles.map((battle) => [battle.id, battle]))
  const counts = (battleId: BattleId) =>
    !input.eventOnly || byId.get(battleId)?.isEvent === true

  let plannedCount = 0
  let plannedEnergy = 0
  for (const [battleId, raids] of input.plannedByBattle) {
    const battle = byId.get(battleId)
    if (!battle || raids <= 0) continue
    plannedEnergy += raids * battle.energyCost
    if (counts(battleId)) plannedCount += raids
  }

  const battlesToGo = Math.max(0, Math.floor(input.battlesToGo))
  const battlesLeft = Math.max(0, battlesToGo - plannedCount)
  const energyBudget = Math.max(
    0,
    input.dailyEnergy - input.realEnergyUsedToday - plannedEnergy
  )

  const pool = input.battles.filter(
    (battle) =>
      battle.energyCost > 0 &&
      (!input.eventOnly || battle.isEvent) &&
      input.passesFilter(battle.id)
  )
  const unfiltered = input.battles.some(
    (battle) => battle.energyCost > 0 && (!input.eventOnly || battle.isEvent)
  )
  // The remaining-campaign summary counts campaign battles, which any node serves, so its cheapest
  // cost ignores the lightning restriction (but keeps unlock state and the Raids Filters).
  const summaryPool = input.battles.filter(
    (battle) => battle.energyCost > 0 && input.passesFilter(battle.id)
  )
  const cheapestEnergyCost =
    summaryPool.length > 0
      ? Math.min(...summaryPool.map((battle) => battle.energyCost))
      : null
  const cheapestDailyCapacity = summaryPool
    .filter((battle) => battle.energyCost === cheapestEnergyCost)
    .reduce((total, battle) => total + battle.dailyAttempts, 0)

  const done = (
    rows: MissionRaidRow[],
    empty: MissionRaidsEmptyReason | null
  ): MissionRaidPlan => {
    const totalRaids = rows.reduce((total, row) => total + row.raids, 0)
    return {
      plannedCount,
      battlesLeft,
      energyBudget,
      rows,
      totalRaids,
      totalEnergy: rows.reduce((total, row) => total + row.energy, 0),
      remainingAfter: Math.max(0, battlesLeft - totalRaids),
      empty: rows.length > 0 ? null : empty,
      cheapestEnergyCost,
      cheapestDailyCapacity,
    }
  }

  if (battlesLeft === 0) return done([], "plan-completes")
  if (input.eventOnly && !input.battles.some((battle) => battle.isEvent)) {
    return done([], "no-event")
  }
  if (pool.length === 0) {
    return done([], unfiltered ? "filtered" : "no-candidates")
  }
  if (energyBudget <= 0) return done([], "no-energy")

  const candidates = [...pool].sort((a, b) => {
    const goalA = input.goalNodesByBattle.get(a.id)?.priority ?? Infinity
    const goalB = input.goalNodesByBattle.get(b.id)?.priority ?? Infinity
    return (
      a.energyCost - b.energyCost ||
      (goalA === goalB ? 0 : goalA < goalB ? -1 : 1) ||
      compareIds(a.id, b.id)
    )
  })

  let budget = energyBudget
  let left = battlesLeft
  // An affordable node with no attempts left: an empty fill then means attempts ran out, not energy.
  let attemptsBlocked = false
  const rows: MissionRaidRow[] = []
  for (const battle of candidates) {
    if (left <= 0) break
    const cap =
      input.attemptsLeftByBattle.get(battle.id) ??
      (battle.dailyAttempts > 0 ? battle.dailyAttempts : Infinity)
    const attempts = cap - (input.plannedByBattle.get(battle.id) ?? 0)
    if (attempts <= 0 && budget >= battle.energyCost) attemptsBlocked = true
    const raids = Math.min(
      attempts,
      Math.floor(budget / battle.energyCost),
      left
    )
    if (raids <= 0) continue
    budget -= raids * battle.energyCost
    left -= raids
    rows.push({
      battleId: battle.id,
      energyCost: battle.energyCost,
      raids,
      energy: raids * battle.energyCost,
      goal: input.goalNodesByBattle.get(battle.id) ?? null,
    })
  }
  return done(rows, attemptsBlocked ? "no-attempts" : "no-energy")
}

/**
 * The raids Today still plans per node: the planned raids less the attempts already used there
 * today, never below 0 (Today's plan is the whole day's run, not what remains).
 */
export function remainingPlannedRaids(
  entries: readonly Pick<RaidBreakdownEntry, "battleId" | "raidsPerformed">[],
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
): Map<BattleId, number> {
  const planned = new Map<BattleId, number>()
  for (const entry of entries) {
    planned.set(
      entry.battleId,
      (planned.get(entry.battleId) ?? 0) + entry.raidsPerformed
    )
  }
  const remaining = new Map<BattleId, number>()
  for (const [battleId, raids] of planned) {
    const left = raids - (attemptsUsedByBattle.get(battleId) ?? 0)
    if (left > 0) remaining.set(battleId, left)
  }
  return remaining
}

/**
 * Per node, the best-priority in-scope goal it feeds: a node drops a resource some goal still needs
 * over its whole schedule (after the Plan's priority-ordered inventory allocation). A goal with
 * pinned farm locations is served only by them, as on the HSE farm list.
 */
export function buildMissionGoalNodes(
  goals: readonly GoalNeed[],
  inventory: EstimatePlanParams["inventory"],
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>
): Map<BattleId, MissionGoalNode> {
  const sorted = [...goals].sort((a, b) => a.priority - b.priority)
  const allocations = allocatePlanInventory(sorted, inventory)
  const nodes = new Map<BattleId, MissionGoalNode>()
  for (const goal of sorted) {
    const pins =
      goal.farmingLocationIds && goal.farmingLocationIds.length > 0
        ? goal.farmingLocationIds
        : undefined
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      for (const need of stage.remaining) {
        if (need.count <= 0) continue
        const upgrade = upgradesById.get(need.id)
        if (!upgrade) continue
        for (const node of collectFarmNodes(upgrade, battlesById, pins)) {
          const existing = nodes.get(node.battleId)
          if (!existing) {
            nodes.set(node.battleId, {
              priority: goal.priority,
              goalIds: [goal.goalId],
              resourceId: need.id,
            })
          } else if (!existing.goalIds.includes(goal.goalId)) {
            existing.goalIds.push(goal.goalId)
          }
        }
      }
    }
  }
  return nodes
}
