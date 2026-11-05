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
  | "no-goals"
  | "no-energy"
  | "nothing-contributes"
  | "filtered"
  | "none-efficient"

/**
 * How the farm list picks its locations. `points`: any point-earning location that drops a needed
 * material, most points per energy first. `energy`: only the locations Today would pick for the
 * material (least energy per item), most points per energy first among them.
 */
export type EventFarmOrder = "points" | "energy"

/** The HSE list's Sort switch: the farm list in either order, or every point-earning location
 * with goals ignored (`selectEventLocations`, points per energy). */
export type HseListMode = EventFarmOrder | "ignoreGoals"

export type EventFarm = {
  rows: EventFarmRow[]
  totalPoints: number
  totalEnergy: number
  /** The energy the list may spend: Infinity on the HSE tab (not bound to today's energy). */
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
  /** Points per energy (default) or energy per item first. */
  order?: EventFarmOrder
  /** Today's "Fewer raids": among locations tied on energy per item, only the costliest per battle. */
  fewerRaids?: boolean
  /** Today's "Combine goals": goal priority no longer breaks ties between locations. */
  combineGoals?: boolean
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
 * point-earning node over a cheaper node without points, where Today picks the cheapest passing node.
 *
 * `order: "energy"` keeps only Today's pick per material (least energy per item among the passing
 * nodes, the costliest per battle of those with `fewerRaids`) before the same fill, so no energy is
 * wasted on materials; a material whose cheapest node earns no points then gets no row
 * (`none-efficient` when that leaves the list empty). `combineGoals` drops goal priority from the
 * tie-break.
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

  const energyOrder = input.order === "energy"
  let pointEarning = false
  const candidatesByBattle = new Map<BattleId, Candidate>()
  for (const [resourceId, goalIds] of goalIdsByResource) {
    const upgrade = input.upgradesById.get(resourceId)
    if (!upgrade) continue
    const nodes = collectFarmNodes(upgrade, input.battlesById)
    const efficient = energyOrder
      ? efficientNodeIds(
          nodes.filter(
            (node) => input.nodeFilter?.(node.battleId, resourceId) ?? true
          ),
          input.fewerRaids ?? false
        )
      : null
    for (const node of nodes) {
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
      pointEarning = true
      // Energy per item: a goal with pinned locations is served by its pins as chosen; any other
      // goal only by the least-energy-per-item node(s) of the material, as Today picks them.
      const efficientServing = efficient
        ? serving.filter(
            (goalId) => !!pinsByGoal.get(goalId) || efficient.has(node.battleId)
          )
        : serving
      if (efficientServing.length === 0) continue

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
        goalIds: efficientServing,
        allowed: input.nodeFilter?.(node.battleId, resourceId) ?? true,
      })
      for (const goalId of efficientServing) {
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
        (input.combineGoals ? 0 : a.priority - b.priority) ||
        a.battleId.localeCompare(b.battleId)
    )
  if (candidates.length === 0) {
    return done(
      [],
      all.length > 0
        ? "filtered"
        : energyOrder && pointEarning
          ? "none-efficient"
          : "nothing-contributes"
    )
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

/**
 * The nodes Today would pick for one material (`selectFarmNodes`' rule): the least energy per item,
 * tied on two decimals, and with `fewerRaids` only the costliest per battle among those.
 */
function efficientNodeIds(
  nodes: readonly {
    battleId: BattleId
    energyCost: number
    dropRate: number
  }[],
  fewerRaids: boolean
): Set<BattleId> {
  if (nodes.length === 0) return new Set()
  const efficiency = (node: (typeof nodes)[number]) =>
    Number((node.energyCost / node.dropRate).toFixed(2))
  const least = Math.min(...nodes.map(efficiency))
  let cheapest = nodes.filter((node) => efficiency(node) === least)
  if (fewerRaids) {
    const most = Math.max(...cheapest.map((node) => node.energyCost))
    cheapest = cheapest.filter((node) => node.energyCost === most)
  }
  return new Set(cheapest.map((node) => node.battleId))
}
