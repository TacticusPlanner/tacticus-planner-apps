import type { CharacterStorageModel } from "@workspace/game-catalog"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import {
  resourceLabel,
  selectFarmNodes,
  type EstimateOutcome,
  type EstimateResourceId,
  type EstimateUpgrade,
  type GoalInventoryAllocation,
  type GoalNeed,
} from "@/features/goal-farming/@x/goal-planning"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup/@x/goal-planning"

import type {
  PlanInsightsBlocker,
  PlanInsightsBottleneck,
} from "./use-plan-insights.domain"

const TOP_BOTTLENECKS = 5

/** What a goal still has to source for each resource once the plan's inventory is spent in priority
 *  order (`allocations`) and its shop/Onslaught suppliers have covered their share (an estimated
 *  goal's `flatSupplyTotal`). */
export function netGoalNeeds(
  goal: GoalNeed,
  allocation: GoalInventoryAllocation | undefined,
  estimate: EstimateOutcome | undefined
): Map<EstimateResourceId, number> {
  const remaining = new Map<EstimateResourceId, number>()
  const stages = allocation?.stages ?? [{ remaining: goal.needs }]
  for (const stage of stages) {
    for (const need of stage.remaining) {
      remaining.set(need.id, (remaining.get(need.id) ?? 0) + need.count)
    }
  }
  const supplied =
    estimate && estimate.status !== "Blocked"
      ? estimate.flatSupplyTotal
      : undefined
  for (const [id, count] of supplied ?? []) {
    const left = (remaining.get(id) ?? 0) - count
    if (left > 0) remaining.set(id, left)
    else remaining.delete(id)
  }
  return remaining
}

/** The plan's farmable bottlenecks and its hard blockers, over the scoped goals only.
 *
 *  A bottleneck is a resource the plan still farms after inventory and flat suppliers, ranked by the
 *  energy to clear it at each goal's own node choice (its pinned `farmingLocationIds`, else the
 *  cheapest node). A resource no usable node drops is not a bottleneck but a blocker, taken from the
 *  estimate's own `blockers` so the reason matches what the goals list shows. */
export function computeBottlenecks(params: {
  goalNeeds: readonly GoalNeed[]
  allocations: ReadonlyMap<string, GoalInventoryAllocation>
  estimates: ReadonlyMap<string, EstimateOutcome>
  combinedUpgradesById: ReadonlyMap<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >
  battlesById: Parameters<typeof selectFarmNodes>[2]
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  dailyEnergy: number
}): { bottlenecks: PlanInsightsBottleneck[]; blockers: PlanInsightsBlocker[] } {
  const label = (id: EstimateResourceId) =>
    resourceLabel(id, params.upgradesById, params.charactersById)

  const farmable = new Map<
    EstimateResourceId,
    { count: number; energyToClear: number; goalIds: Set<string> }
  >()
  const blockers = new Map<string, PlanInsightsBlocker>()

  for (const goal of params.goalNeeds) {
    const estimate = params.estimates.get(goal.goalId)
    const blocked = new Set<EstimateResourceId>()
    if (estimate?.status === "Blocked") {
      for (const blocker of estimate.blockers ?? []) {
        blocked.add(blocker.resourceId)
        const key = `${blocker.reason}:${blocker.resourceId}`
        const entry = blockers.get(key) ?? {
          key,
          reason: blocker.reason,
          resourceId: blocker.resourceId,
          label: label(blocker.resourceId),
          remaining: 0,
          goalIds: [],
        }
        entry.remaining += blocker.remaining
        if (!entry.goalIds.includes(goal.goalId)) {
          entry.goalIds.push(goal.goalId)
        }
        blockers.set(key, entry)
      }
      // A goal-wide block (`SimulationLimit`, `UnsupportedCost`) names no resource.
      if (!estimate.blockers) {
        const key = `${estimate.reason}:`
        const entry = blockers.get(key) ?? {
          key,
          reason: estimate.reason,
          resourceId: null,
          label: null,
          remaining: 0,
          goalIds: [],
        }
        entry.goalIds.push(goal.goalId)
        blockers.set(key, entry)
        continue
      }
    }

    const net = netGoalNeeds(
      goal,
      params.allocations.get(goal.goalId),
      estimate
    )
    for (const [id, count] of net) {
      if (blocked.has(id)) continue
      const nodes = selectFarmNodes(
        { id, count },
        params.combinedUpgradesById,
        params.battlesById,
        goal.farmingLocationIds
      )
      // Of several pinned (or tied) nodes, the most energy-efficient one bounds the cost.
      const energyPerItem = (node: (typeof nodes)[number]) =>
        node.energyCost / node.dropRate
      const best = nodes
        .filter((node) => node.dropRate > 0)
        .sort((a, b) => energyPerItem(a) - energyPerItem(b))[0]
      if (!best) continue
      const entry = farmable.get(id) ?? {
        count: 0,
        energyToClear: 0,
        goalIds: new Set<string>(),
      }
      entry.count += count
      entry.energyToClear += Math.ceil(count / best.dropRate) * best.energyCost
      entry.goalIds.add(goal.goalId)
      farmable.set(id, entry)
    }
  }

  const bottlenecks = [...farmable.entries()]
    .map(([id, entry]) => ({
      id,
      label: label(id),
      count: entry.count,
      energyToClear: entry.energyToClear,
      days: entry.energyToClear / Math.max(1, params.dailyEnergy),
      goalIds: [...entry.goalIds],
    }))
    .filter((entry) => entry.energyToClear > 0)
    .sort((a, b) => b.energyToClear - a.energyToClear)
    .slice(0, TOP_BOTTLENECKS)

  return { bottlenecks, blockers: [...blockers.values()] }
}
