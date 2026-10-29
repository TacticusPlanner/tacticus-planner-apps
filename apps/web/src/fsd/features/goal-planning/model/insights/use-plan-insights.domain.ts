import type { Rarity } from "@workspace/game-domain"

import type { CampaignInsight } from "@/features/campaign-insights/@x/goal-planning"

import type {
  AbilityMaterials,
  EstimateOutcome,
  EstimateResourceId,
  RankSlotAllocation,
} from "@/features/goal-farming/@x/goal-planning"

// Input/output shapes for the Insights view's plan-wide aggregation (plan-insights-calc.ts), kept
// separate from the calc itself — mirrors estimate.domain.ts / estimate.ts.

export interface PlanInsightsTotals {
  upgradesByRarity: Partial<Record<Rarity, number>>
  orbsByType: Partial<Record<Rarity, number>>
  shards: number
  mythicShards: number
}

/** What the plan still lacks once the account's stock is spent in priority order (V1's "Total
 *  Resources Missing"). Alliance keys are `Imperial`/`Xenos`/`Chaos`. */
export interface PlanMissingResources {
  abilityBadges: Partial<Record<string, Partial<Record<Rarity, number>>>>
  orbs: Partial<Record<string, Partial<Record<Rarity, number>>>>
  forgeBadges: Partial<Record<Rarity, number>>
  components: Partial<Record<string, number>>
  /** Raw level XP the owned XP books don't cover. */
  xp: number
  /** `xp` as whole books of the user's selected XP-book rarity; `null` without the level rules. */
  xpBooks: { rarity: Rarity; count: number } | null
}

export interface PlanInsightsBottleneck {
  id: EstimateResourceId
  label: string
  energyToClear: number
}

/** A goal's remaining resources after the plan spends the shared stock in priority order, overriding
 *  the goal's standalone figures. Absent (a paused goal) means the standalone need applies. */
export interface PlanNetResources {
  orbsByType?: Partial<Record<Rarity, number>>
  shards?: number
  mythicShards?: number
  /** Ascension goals in the plan: each orb rarity the goal needs (gross) beside the player's stock of it
   *  at the goal's turn in priority order, uncapped (V1's orb "x/y"; the Machine of War pool logic). */
  orbPool?: {
    neededByRarity: Partial<Record<Rarity, number>>
    availableByRarity: Partial<Record<Rarity, number>>
  }
  /** Ascension goals: owned shards the plan spends on the goal against its gross shard cost. */
  shardProgress?: {
    shards: { owned: number; needed: number }
    mythicShards: { owned: number; needed: number }
  }
  /** Rank goals: gold to apply the level-up books (V1's Rank "Gold"), never netted against stock. */
  levelGold?: number
  /** Rank goals partly covered by a higher-priority goal: the goal's standalone slots and energy. */
  standalone?: { slots: number; energy: number }
  /** Rank/Ability goals whose level requirement is partly covered by a higher-priority goal of the
   *  same unit: the level the goal's own interval starts from (displayed "Lv 35 -> 38"). */
  levelChainedFrom?: number
}

export interface PlanInsightsResult {
  totals: PlanInsightsTotals
  missing: PlanMissingResources
  energyTotal: number
  onslaughtTokens: number
  onslaughtDays: number
  estimates: ReadonlyMap<string, EstimateOutcome>
  potentialProgressByGoalId: Map<string, number>
  /** Each Rank goal's upgrade slots as allocated in the one plan (`allocated`: net of applied slots and
   *  slots a higher-priority goal for the same character already claimed) beside the goal's own
   *  `standalone` count — `allocated` 0 with `standalone` above 0 means an earlier goal covers it. */
  rankSlotsByGoalId: Map<string, RankSlotAllocation>
  /** Each Ability goal's gold/badges/forge badges/components as allocated in the one plan (net of
   *  levels a higher-priority goal for the same unit covers); `null` when nothing is left. */
  abilityMaterialsByGoalId: Map<string, AbilityMaterials | null>
  planNetByGoalId: Map<string, PlanNetResources>
  /** Potential progress of each Rank/Ability goal's *level requirement* from owned XP books, keyed by
   *  that goal's id — separate from `potentialProgressByGoalId`, which is the same goal's material
   *  Potential. */
  levelPotentialProgressByGoalId: Map<string, number>
  /** Each Rank/Ability goal's own charged XP interval (show-xp-book-availability-per-goal) — raw XP,
   *  rarity-agnostic; a consumer converts it to a *needed* book-equivalent count in the user's
   *  selected XP-book rarity. Only a goal whose character is below its required level gets an entry. */
  levelChargedXpByGoalId: Map<string, number>
  /** The shared owned-book pool's raw XP total at each Rank/Ability goal's own turn in priority order
   *  (show-xp-book-availability-per-goal) — raw XP, rarity-agnostic; a consumer converts it to an
   *  *available* book-equivalent count in the user's selected XP-book rarity. Only a goal whose
   *  character is below its required level gets an entry. */
  levelPoolXpAvailableByGoalId: Map<string, number>
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
  missing: {
    abilityBadges: {},
    orbs: {},
    forgeBadges: {},
    components: {},
    xp: 0,
    xpBooks: null,
  },
  energyTotal: 0,
  onslaughtTokens: 0,
  onslaughtDays: 0,
  estimates: new Map(),
  potentialProgressByGoalId: new Map(),
  rankSlotsByGoalId: new Map(),
  abilityMaterialsByGoalId: new Map(),
  planNetByGoalId: new Map(),
  levelPotentialProgressByGoalId: new Map(),
  levelChargedXpByGoalId: new Map(),
  levelPoolXpAvailableByGoalId: new Map(),
  completionDate: null,
  unestimatedGoalCount: 0,
  bottlenecks: [],
  campaignInsights: [],
  eventInsights: [],
  benefitingGoalIdsByInsightId: new Map(),
}
