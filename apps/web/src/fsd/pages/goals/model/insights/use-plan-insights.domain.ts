import type { Rarity } from "@workspace/game-domain"

import type { CampaignInsight } from "@/features/campaign-insights"

import type {
  EstimateOutcome,
  EstimateResourceId,
} from "@/features/goal-farming"

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
  estimates: ReadonlyMap<string, EstimateOutcome>
  potentialProgressByGoalId: Map<string, number>
  /** Potential progress of each Rank/Ability goal's *level requirement* from owned XP books, keyed by
   *  that goal's id — separate from `potentialProgressByGoalId`, which is the same goal's material
   *  Potential. */
  levelPotentialProgressByGoalId: Map<string, number>
  /** The latest completion date (ISO `yyyy-mm-dd`) among the plan's goals that could be estimated,
   *  extended by Onslaught token accumulation when the plan needs more tokens than the account
   *  holds. `null` only when *no* goal in the plan could be estimated — a goal that is blocked or
   *  uncostable is excluded from the maximum rather than suppressing it (`unestimatedGoalCount`). */
  completionDate: string | null
  /** How many of the plan's goals are *not* behind `completionDate` — blocked, unestimated, or
   *  filtered out before estimation. Surfaces showing the date must show this alongside it, so a
   *  partial date never reads as covering the whole plan (see the `plan-completion-outlook` spec). */
  unestimatedGoalCount: number
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
  levelPotentialProgressByGoalId: new Map(),
  completionDate: null,
  unestimatedGoalCount: 0,
  bottlenecks: [],
  campaignInsights: [],
  eventInsights: [],
  benefitingGoalIdsByInsightId: new Map(),
}
