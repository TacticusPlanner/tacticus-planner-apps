import type {
  BattleId,
  Rank,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

// Input/output shapes for the day-by-day estimation engine (estimate.ts). Kept separate from the
// calc functions themselves, mirroring rank-lookup.domain.ts / rank-lookup-calc.ts.

/** A farmable character shard resource (plan §16 phase 7) — folded into the same day-by-day engine
 *  as upgrade materials via a synthetic `EstimateUpgrade` entry keyed by this id, since a character's
 *  `shardLocations` use the identical `FarmLocation` shape as an upgrade's. Mythic shards and orbs
 *  have no campaign-node farm source (Onslaught/events only), so they never get one of these ids and
 *  stay count-only in the Insights breakdown rather than entering the simulator. */
export type ShardResourceId = `shard:${string}`

export function shardResourceId(entityId: string): ShardResourceId {
  return `shard:${entityId}`
}

/** Any resource the engine can farm a day-by-day estimate for: an upgrade material, or (phase 7) a
 *  farmable character shard. */
export type EstimateResourceId = UpgradeId | ShardResourceId

/** How much of one farmable resource is still needed. */
export interface CountedResourceNeed<TId extends string> {
  id: TId
  count: number
}

export type UpgradeNeed = CountedResourceNeed<EstimateResourceId>

/** The minimal shape the engine needs from an upgrade (or shard) record — any richer catalog type
 *  (e.g. rank-lookup's `UpgradeWithFarmLocations`) satisfies this structurally. */
export interface EstimateUpgrade {
  id: EstimateResourceId
  farmLocations: FarmLocation[]
}

export interface FarmingCharacter {
  id: UnitId
  name: string
  rankUpUpgrades: { rank: Rank; upgradeIds: UpgradeId[] }[]
}

interface FarmingRecipeIngredient {
  material: UpgradeId
  count: number
  recipe?: FarmingRecipeIngredient[] | null
}

export interface FarmingUpgrade extends EstimateUpgrade {
  id: UpgradeId
  label: string
  rarity: Rarity
  stat: string
  crafted: boolean
  recipe: FarmingRecipeIngredient[]
}

/** One battle node's farming economics for a single material. */
export interface FarmNode {
  battleId: BattleId
  energyCost: number
  dropRate: number
  /** The node's daily attempt cap — shared across every material farmed from the same battle within
   *  one simulated day (see spendDay's per-battleId attempt tracking), since it's the same real-world
   *  battle regardless of which material happens to drop there. */
  dailyAttempts: number
}

export interface RaidBreakdownEntry {
  goalId: string
  resourceId: EstimateResourceId
  battleId: BattleId
  raidsPerformed: number
  itemsFarmed: number
  energySpent: number
  dailyAttempts: number
}

export interface RaidDaySchedule {
  day: number
  entries: RaidBreakdownEntry[]
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  energyTotal: number
  raidsTotal: number
}

export interface RaidPlanSummary {
  totalDays: number
  totalEnergy: number
  totalRaids: number
  daysWithUnusedEnergy: number
  completionDate: string
}

export interface RaidPlanSchedule {
  days: RaidDaySchedule[]
  outcomes: Map<string, EstimateOutcome>
  summary: RaidPlanSummary
}

/** One goal's material demand within a priority-shared plan estimate (`estimatePlan`). */
export interface InventoryAllocationGoal<TId extends string> {
  goalId: string
  /** Per-project priority — lower runs first and claims shared inventory/energy ahead of higher
   *  numbers, mirroring `project_goals.priority` (plan §5). */
  priority: number
  needs: CountedResourceNeed<TId>[]
  /** Ordered farming segments for this goal. Missing/empty means one TotalUpgrades stage. */
  stages?: readonly { target: string; needs: CountedResourceNeed<TId>[] }[]
}

/** One goal's farmable material demand within a priority-shared plan estimate. */
export interface GoalNeed extends InventoryAllocationGoal<EstimateResourceId> {
  /** Restricts farming to these battle ids when set (goal's `config.farmingLocationIds`); otherwise
   *  the engine auto-selects the least-energy node(s) per material. */
  farmingLocationIds?: readonly string[] | null
}

interface InventoryAllocationStage<TId extends string> {
  target: string
  needs: CountedResourceNeed<TId>[]
  remaining: CountedResourceNeed<TId>[]
}

export interface GoalInventoryAllocation<
  TId extends string = EstimateResourceId,
> {
  goalId: string
  stages: InventoryAllocationStage<TId>[]
}

interface EstimateResult {
  status?: "Estimated"
  /** Days of farming until every material need is met. */
  days: number
  /** ISO `yyyy-mm-dd` completion date, `days` after the estimate's reference date. */
  date: string
  energyTotal: number
  raidsTotal: number
}

export type EstimateBlockedReason =
  | "NoFarmLocation"
  | "FarmingOverrideUnavailable"
  | "InsufficientDailyEnergy"
  | "SimulationLimit"
  | "UnsupportedCost"

interface EstimateBlocked {
  status: "Blocked"
  reason: EstimateBlockedReason
  resourceIds: EstimateResourceId[]
  days?: never
  date?: never
  energyTotal?: never
  raidsTotal?: never
}

export type EstimateOutcome = EstimateResult | EstimateBlocked

export type { Battle, FarmLocation }
