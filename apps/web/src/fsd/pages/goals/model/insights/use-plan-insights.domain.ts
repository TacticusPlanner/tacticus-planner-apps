import type { Rarity } from "@workspace/game-domain"

import type { CampaignInsight } from "@/features/campaign-insights"

import type {
  EstimateOutcome,
  EstimateResourceId,
} from "../estimate/estimate.domain"

// Input/output shapes for the Insights view's plan-wide aggregation (plan-insights-calc.ts), kept
// separate from the calc itself — mirrors estimate.domain.ts / estimate.ts.

export interface PlanInsightsTotals {
  upgradesByRarity: Partial<Record<Rarity, number>>
  orbsByType: Partial<Record<Rarity, number>>
  shards: number
  mythicShards: number
}

export interface PlanInsightsBottleneck {
  id: EstimateResourceId
  label: string
  energyToClear: number
}

export interface PlanInsightsResult {
  totals: PlanInsightsTotals
  energyTotal: number
  onslaughtTokens: number
  onslaughtDays: number
  estimates: Map<string, EstimateOutcome>
  potentialProgressByGoalId: Map<string, number>
  /** The latest per-goal completion date across the plan (ISO `yyyy-mm-dd`); `null` when nothing is
   *  farmable yet, or any farmable goal can never complete within the simulator's day budget. */
  completionDate: string | null
  bottlenecks: PlanInsightsBottleneck[]
  campaignInsights: CampaignInsight<EstimateResourceId>[]
  eventInsights: CampaignInsight<EstimateResourceId>[]
  /** Every goal id that contributed a resource to a given insight (by the insight's `id`) — the
   *  "which characters/MoW benefit" list (plan §16 phase 7); resolve goalId -> entity via the
   *  member list itself or `useGoalCatalog().getEntityName`. */
  benefitingGoalIdsByInsightId: Map<string, string[]>
}

export const EMPTY_PLAN_INSIGHTS_RESULT: PlanInsightsResult = {
  totals: { upgradesByRarity: {}, orbsByType: {}, shards: 0, mythicShards: 0 },
  energyTotal: 0,
  onslaughtTokens: 0,
  onslaughtDays: 0,
  estimates: new Map(),
  potentialProgressByGoalId: new Map(),
  completionDate: null,
  bottlenecks: [],
  campaignInsights: [],
  eventInsights: [],
  benefitingGoalIdsByInsightId: new Map(),
}
