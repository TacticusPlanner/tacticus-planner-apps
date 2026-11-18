import type { BattleId, CampaignId } from "@workspace/game-domain"
import type { CampaignDescriptor } from "@workspace/game-catalog"

import { computeCampaignInsights } from "@/entities/campaign-insight"
import type {
  CampaignInsight,
  CampaignInsightUpgrade,
} from "@/entities/campaign-insight"
import type { Battle, EstimateResourceId } from "@/entities/goal-farming"

import { summarizeFarmingSpots } from "./plan-farming-spots"
import type {
  PlanFarmingInsights,
  PlanFarmingSpot,
} from "./use-plan-insights.domain"

/**
 * "Best campaigns/events to farm" over one set of nodes: every campaign (and event campaign) that
 * drops something the plan still farms, with what farming there takes and the goals it helps.
 * Ranked by the share of the still-needed items that drop there, most first, then by energy per
 * item, least first, so the order reads straight off the numbers each row shows.
 */
export function buildFarmingInsights(input: {
  needs: readonly { id: EstimateResourceId; count: number }[]
  upgradesById: ReadonlyMap<
    EstimateResourceId,
    CampaignInsightUpgrade<EstimateResourceId>
  >
  battlesById: ReadonlyMap<BattleId, Battle>
  isEventGroup: (groupId: CampaignId) => boolean
  resolveLabel: (descriptor: CampaignDescriptor, isEvent: boolean) => string
  provenance: ReadonlyMap<EstimateResourceId, ReadonlySet<string>>
  dailyEnergy: number
}): PlanFarmingInsights {
  const { campaignInsights, eventInsights } = computeCampaignInsights(
    [...input.needs],
    input.upgradesById,
    input.battlesById,
    input.isEventGroup,
    input.resolveLabel,
    Number.POSITIVE_INFINITY
  )
  const totalItems = input.needs.reduce((sum, need) => sum + need.count, 0)
  const farmingSpotsByInsightId = summarizeFarmingSpots(
    [...campaignInsights, ...eventInsights],
    input.battlesById,
    input.dailyEnergy,
    totalItems
  )

  const benefitingGoalIdsByInsightId = new Map<string, string[]>()
  for (const insight of [...campaignInsights, ...eventInsights]) {
    const goalIds = new Set<string>()
    for (const contribution of insight.contributions) {
      for (const goalId of input.provenance.get(contribution.upgradeId) ?? []) {
        goalIds.add(goalId)
      }
    }
    benefitingGoalIdsByInsightId.set(insight.id, [...goalIds])
  }

  const byCoverage = rankByCoverage(farmingSpotsByInsightId)
  return {
    campaignInsights: campaignInsights.toSorted(byCoverage),
    eventInsights: eventInsights.toSorted(byCoverage),
    farmingSpotsByInsightId,
    benefitingGoalIdsByInsightId,
  }
}

/** Larger share of the needed items first, then less energy per item; unsummarised last. */
function rankByCoverage(spots: ReadonlyMap<string, PlanFarmingSpot>) {
  const energyPerItem = (spot: PlanFarmingSpot) =>
    spot.itemCount > 0 ? spot.energy / spot.itemCount : Number.POSITIVE_INFINITY
  return (
    a: CampaignInsight<EstimateResourceId>,
    b: CampaignInsight<EstimateResourceId>
  ) => {
    const spotA = spots.get(a.id)
    const spotB = spots.get(b.id)
    if (!spotA || !spotB) return (spotA ? -1 : 0) + (spotB ? 1 : 0)
    const byCoverage = spotB.coverage - spotA.coverage
    if (byCoverage !== 0) return byCoverage
    const byEnergy = energyPerItem(spotA) - energyPerItem(spotB)
    return byEnergy === 0 ? b.score - a.score : byEnergy
  }
}
