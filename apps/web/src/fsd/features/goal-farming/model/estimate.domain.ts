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
 *  `shardLocations` use the identical `FarmLocation` shape as an upgrade's. */
export type ShardResourceId = `shard:${string}`

export function shardResourceId(entityId: string): ShardResourceId {
  return `shard:${entityId}`
}

/** A mythic character shard resource (tacticus-planner-apps#103) — mythic shards have no campaign-
 *  node farm source (Onslaught/Shops only, never a `FarmLocation`), so a mythic need only ever enters
 *  the simulator via a `FlatSupplier` (an Onslaught or Shop acquisition source); with none selected it
 *  stays count-only, as it always has. */
export type MythicShardResourceId = `mythic-shard:${string}`

export function mythicShardResourceId(entityId: string): MythicShardResourceId {
  return `mythic-shard:${entityId}`
}

/** Any resource the engine can farm a day-by-day estimate for: an upgrade material, or (phase 7) a
 *  farmable character shard (regular or, via a flat supplier only, mythic). */
export type EstimateResourceId =
  UpgradeId | ShardResourceId | MythicShardResourceId

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

/** An energy-free per-day contributor to a resource's need — a selected daily-shop offer or an
 *  Onslaught source (plan: acquisition-source picker, tacticus-planner-apps#103). `supplyOnDay` is
 *  called once per simulated day with a 0-based day index (day 1 of the simulation = index 0) and
 *  returns that day's available amount (already accounting for weekday availability / expected-value
 *  weighting) — never consulted for daily energy or raid counts. */
export interface FlatSupplier {
  resourceId: EstimateResourceId
  supplyOnDay: (dayIndex: number) => number
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
  outcomes: ReadonlyMap<string, EstimateOutcome>
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
  /** This goal's selected non-campaign acquisition sources (shop offers, Onslaught), if any — see
   *  `FlatSupplier`. */
  flatSuppliers?: readonly FlatSupplier[]
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
  /** ISO `yyyy-mm-dd` completion date, with the estimate's reference date treated as Day 1. */
  date: string
  energyTotal: number
  raidsTotal: number
  /** How much of each resource's need was covered by a `FlatSupplier` rather than campaign farming —
   *  present whenever any `FlatSupplier` contributed. UI reads a source's own contribution from here
   *  rather than recomputing it (plan: one canonical result structure). */
  flatSupplyTotal?: ReadonlyMap<EstimateResourceId, number>
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
