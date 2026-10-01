import type { BattleId } from "@workspace/game-domain"

import {
  allocatePlanInventory,
  collectFarmNodes,
  type EstimatePlanParams,
  type EstimateResourceId,
  type EstimateUpgrade,
  type FarmNodeFilter,
  type GoalNeed,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

/** One location of the Dailies > HSE farm list. */
type EventFarmRow = {
  battleId: BattleId
  energyCost: number
  pointsPerRaid: number
  /** Points per raid divided by energy cost: the order key of the list. */
  ratio: number
  raids: number
  /** Expected event points: points per raid x raids. */
  points: number
  /** Energy spent: energy cost x raids. */
  energy: number
  /** The goals the location serves, distinct, in goal-priority order. */
  goalIds: string[]
  /** The needed resource it drops that the row shows (the one serving the best-priority goal). */
  resourceId: EstimateResourceId
}

export type EventFarmEmptyReason =
  "no-goals" | "no-energy" | "nothing-contributes" | "filtered"

export type EventFarm = {
  rows: EventFarmRow[]
  totalPoints: number
  totalEnergy: number
  /** Daily energy minus real energy spent today, never below 0. */
  energyBudget: number
  /** Why `rows` is empty, null when it is not. */
  empty: EventFarmEmptyReason | null
}

export type PlanEventFarmInput = {
  goals: readonly GoalNeed[]
  inventory: EstimatePlanParams["inventory"]
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  /** The battles the player can raid by campaign progress (event nodes only while their event is active). */
  battlesById: ReadonlyMap<BattleId, Battle>
  pointsByBattleId: ReadonlyMap<BattleId, number>
  /** Real attempts left today where synced; a node absent here has its full daily cap. */
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  energyBudget: number
  /** The applied Raids Filters (`buildFarmNodeFilter`), evaluated per node and dropped resource. */
  nodeFilter?: FarmNodeFilter
}

// Float drop rates leave dust after subtracting farmed amounts; do not round it up into a raid.
const EPSILON = 1e-9

type Drop = {
  resourceId: EstimateResourceId
  dropRate: number
  goalIds: string[]
  allowed: boolean
}
type Candidate = {
  battleId: BattleId
  energyCost: number
  dailyAttempts: number
  pointsPerRaid: number
  ratio: number
  drops: Drop[]
  /** Best (lowest) priority among the goals it serves, for the tie-break. */
  priority: number
}

/**
 * The Dailies > HSE farm list: where to spend the energy left today to earn event points while still
 * feeding the player's goals, computed over the whole schedule rather than Today's picks.
 *
 * The schedule need is each goal's remaining need over every stage after the Plan's priority-ordered
 * inventory allocation. A location is a candidate when it earns points, can be raided (eligible, energy
 * cost, attempts left), drops a resource some goal still needs there (a goal with pinned locations is
 * only served by them) and passes the filter for that drop. Candidates are filled in order of points
 * per energy (then points per raid, goal priority, battle id) until the budget is used: each gets the
 * raids its attempts, the budget and the still-unmet need allow, and a location that does not fit is
 * skipped, not a stop. This is a filter-then-pick (an implicit "earns points" filter): it prefers a
 * point-earning node over a cheaper node without points, unlike Today's pick-then-drop.
 *
 * ponytail: greedy by ratio, not an optimal packing; shop/Onslaught suppliers and stage order are
 * ignored. A knapsack over (raids, energy) would be the upgrade if the greedy fill proves too loose.
 */
export function planEventFarm(input: PlanEventFarmInput): EventFarm {
  const energyBudget = Math.max(0, input.energyBudget)
  const done = (
    rows: EventFarmRow[],
    empty: EventFarmEmptyReason | null
  ): EventFarm => ({
    rows,
    totalPoints: rows.reduce((total, row) => total + row.points, 0),
    totalEnergy: rows.reduce((total, row) => total + row.energy, 0),
    energyBudget,
    empty: rows.length > 0 ? null : empty,
  })
  if (input.goals.length === 0) return done([], "no-goals")

  const goals = [...input.goals].sort((a, b) => a.priority - b.priority)
  const priorityByGoal = new Map(
    goals.map((goal) => [goal.goalId, goal.priority])
  )
  const pinsByGoal = new Map(
    goals.map((goal) => [
      goal.goalId,
      goal.farmingLocationIds && goal.farmingLocationIds.length > 0
        ? goal.farmingLocationIds
        : null,
    ])
  )

  // Schedule need: per resource, the remaining need of every stage, and which goals have it.
  const remainingNeed = new Map<EstimateResourceId, number>()
  const goalIdsByResource = new Map<EstimateResourceId, string[]>()
  const allocations = allocatePlanInventory(goals, input.inventory)
  for (const goal of goals) {
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      for (const need of stage.remaining) {
        if (need.count <= 0) continue
        remainingNeed.set(
          need.id,
          (remainingNeed.get(need.id) ?? 0) + need.count
        )
        const ids = goalIdsByResource.get(need.id) ?? []
        if (!ids.includes(goal.goalId)) ids.push(goal.goalId)
        goalIdsByResource.set(need.id, ids)
      }
    }
  }

  const candidatesByBattle = new Map<BattleId, Candidate>()
  for (const [resourceId, goalIds] of goalIdsByResource) {
    const upgrade = input.upgradesById.get(resourceId)
    if (!upgrade) continue
    for (const node of collectFarmNodes(upgrade, input.battlesById)) {
      const pointsPerRaid = input.pointsByBattleId.get(node.battleId) ?? 0
      if (pointsPerRaid <= 0) continue
      const attempts =
        input.attemptsLeftByBattle.get(node.battleId) ??
        (node.dailyAttempts > 0 ? node.dailyAttempts : Infinity)
      if (attempts <= 0) continue
      const serving = goalIds.filter((goalId) => {
        const pins = pinsByGoal.get(goalId)
        return !pins || pins.includes(node.battleId)
      })
      if (serving.length === 0) continue

      const candidate = candidatesByBattle.get(node.battleId) ?? {
        battleId: node.battleId,
        energyCost: node.energyCost,
        dailyAttempts: node.dailyAttempts,
        pointsPerRaid,
        ratio: pointsPerRaid / node.energyCost,
        drops: [],
        priority: Infinity,
      }
      candidate.drops.push({
        resourceId,
        dropRate: node.dropRate,
        goalIds: serving,
        allowed: input.nodeFilter?.(node.battleId, resourceId) ?? true,
      })
      for (const goalId of serving) {
        candidate.priority = Math.min(
          candidate.priority,
          priorityByGoal.get(goalId) ?? Infinity
        )
      }
      candidatesByBattle.set(node.battleId, candidate)
    }
  }

  const all = [...candidatesByBattle.values()]
  const candidates = all
    .filter((candidate) => candidate.drops.some((drop) => drop.allowed))
    .sort(
      (a, b) =>
        b.ratio - a.ratio ||
        b.pointsPerRaid - a.pointsPerRaid ||
        a.priority - b.priority ||
        a.battleId.localeCompare(b.battleId)
    )
  if (candidates.length === 0) {
    return done([], all.length > 0 ? "filtered" : "nothing-contributes")
  }

  let budget = energyBudget
  const rows: EventFarmRow[] = []
  for (const candidate of candidates) {
    const useful = candidate.drops.filter(
      (drop) =>
        drop.allowed && (remainingNeed.get(drop.resourceId) ?? 0) > EPSILON
    )
    if (useful.length === 0) continue
    const attempts =
      input.attemptsLeftByBattle.get(candidate.battleId) ??
      (candidate.dailyAttempts > 0 ? candidate.dailyAttempts : Infinity)
    const needed = Math.max(
      ...useful.map((drop) =>
        Math.ceil(
          (remainingNeed.get(drop.resourceId) ?? 0) / drop.dropRate - EPSILON
        )
      )
    )
    const raids = Math.min(
      attempts,
      Math.floor(budget / candidate.energyCost),
      needed
    )
    if (raids <= 0) continue

    for (const drop of useful) {
      remainingNeed.set(
        drop.resourceId,
        Math.max(
          0,
          (remainingNeed.get(drop.resourceId) ?? 0) - raids * drop.dropRate
        )
      )
    }
    budget -= raids * candidate.energyCost
    const goalIds = [...new Set(useful.flatMap((drop) => drop.goalIds))].sort(
      (a, b) => (priorityByGoal.get(a) ?? 0) - (priorityByGoal.get(b) ?? 0)
    )
    const shown = [...useful].sort(
      (a, b) =>
        Math.min(...a.goalIds.map((id) => priorityByGoal.get(id) ?? Infinity)) -
        Math.min(...b.goalIds.map((id) => priorityByGoal.get(id) ?? Infinity))
    )[0]!
    rows.push({
      battleId: candidate.battleId,
      energyCost: candidate.energyCost,
      pointsPerRaid: candidate.pointsPerRaid,
      ratio: candidate.ratio,
      raids,
      points: raids * candidate.pointsPerRaid,
      energy: raids * candidate.energyCost,
      goalIds,
      resourceId: shown.resourceId,
    })
  }
  // Rows are empty only when no candidate fit the budget (the first one always fits otherwise).
  return done(rows, "no-energy")
}
