import type { CharacterStorageModel } from "@workspace/game-catalog"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import {
  resourceLabel,
  selectFarmNodes,
  type EstimateResourceId,
  type EstimateUpgrade,
  type GoalNeed,
} from "@/features/goal-farming"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import type { PlanInsightsBottleneck } from "./use-plan-insights.domain"

/** The aggregated (not per-goal) remaining count for each distinct farmable resource across `goalNeeds`,
 *  ranked by energy-to-clear at its cheapest node — the resources most likely to gate the plan. */
export function computeBottlenecks(params: {
  goalNeeds: readonly GoalNeed[]
  combinedUpgradesById: ReadonlyMap<
    EstimateResourceId,
    EstimateUpgrade & { rarity: Rarity }
  >
  battlesById: Parameters<typeof selectFarmNodes>[2]
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
}): PlanInsightsBottleneck[] {
  const aggregatedNeeds = new Map<EstimateResourceId, number>()
  for (const goal of params.goalNeeds) {
    for (const need of goal.needs) {
      aggregatedNeeds.set(
        need.id,
        (aggregatedNeeds.get(need.id) ?? 0) + need.count
      )
    }
  }
  return [...aggregatedNeeds.entries()]
    .map(([id, count]) => {
      const nodes = selectFarmNodes(
        { id, count },
        params.combinedUpgradesById,
        params.battlesById
      )
      const cheapest = nodes[0]
      const energyToClear = cheapest
        ? Math.ceil(count / cheapest.dropRate) * cheapest.energyCost
        : Number.POSITIVE_INFINITY
      const label = resourceLabel(
        id,
        params.upgradesById,
        params.charactersById
      )
      return { id, label, energyToClear }
    })
    .filter((entry) => Number.isFinite(entry.energyToClear))
    .sort((a, b) => b.energyToClear - a.energyToClear)
    .slice(0, 5)
}
