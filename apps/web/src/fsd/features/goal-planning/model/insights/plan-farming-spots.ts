import type { BattleId } from "@workspace/game-domain"

import type { CampaignInsight } from "@/features/campaign-insights/@x/goal-planning"
import type {
  Battle,
  EstimateResourceId,
} from "@/features/goal-farming/@x/goal-planning"

import type { PlanFarmingSpot } from "./use-plan-insights.domain"

/** What farming each recommended campaign/event would take: how many of the plan's still-needed
 *  resources drop there, and the energy (and days at `dailyEnergy`) to clear them all at the most
 *  energy-efficient node the campaign has for each. Keyed by the insight's `id`. */
export function summarizeFarmingSpots(
  insights: readonly CampaignInsight<EstimateResourceId>[],
  battlesById: ReadonlyMap<BattleId, Battle>,
  dailyEnergy: number
): Map<string, PlanFarmingSpot> {
  const spots = new Map<string, PlanFarmingSpot>()
  for (const insight of insights) {
    // A resource's need is split across one contribution per goal need and node; sum per node.
    const countByNode = new Map<
      EstimateResourceId,
      Map<BattleId, { count: number; dropRate: number }>
    >()
    for (const contribution of insight.contributions) {
      if (contribution.dropRate <= 0) continue
      const nodes =
        countByNode.get(contribution.upgradeId) ??
        new Map<BattleId, { count: number; dropRate: number }>()
      const node = nodes.get(contribution.battleId) ?? {
        count: 0,
        dropRate: contribution.dropRate,
      }
      node.count += contribution.count
      nodes.set(contribution.battleId, node)
      countByNode.set(contribution.upgradeId, nodes)
    }

    let energy = 0
    for (const nodes of countByNode.values()) {
      const costs = [...nodes.entries()].flatMap(([battleId, node]) => {
        const energyCost = battlesById.get(battleId)?.energyCost ?? 0
        return energyCost > 0
          ? [Math.ceil(node.count / node.dropRate) * energyCost]
          : []
      })
      if (costs.length > 0) energy += Math.min(...costs)
    }

    spots.set(insight.id, {
      resourceCount: countByNode.size,
      energy,
      days: energy / Math.max(1, dailyEnergy),
    })
  }
  return spots
}
