import type { BattleId, UpgradeId } from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

// Input/output shapes for the day-by-day estimation engine (estimate.ts). Kept separate from the
// calc functions themselves, mirroring rank-lookup.domain.ts / rank-lookup-calc.ts.

// Matches V1's default daily energy budget. A Planning-settings UI to make this user-configurable is
// plan §16 phase 8 — until then every estimate (creation preview and plan-context) assumes this
// budget. Shared here so `use-create-goal-form`'s preview and `use-plan-estimate` both estimate
// against the same default.
export const DAILY_ENERGY = 480

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
export interface MaterialNeed {
  id: EstimateResourceId
  count: number
}

/** The minimal shape the engine needs from an upgrade (or shard) record — any richer catalog type
 *  (e.g. rank-lookup's `UpgradeWithFarmLocations`) satisfies this structurally. */
export interface EstimateUpgrade {
  id: EstimateResourceId
  farmLocations: FarmLocation[]
}

/** One battle node's farming economics for a single material. */
export interface FarmNode {
  battleId: BattleId
  energyCost: number
  dropRate: number
}

/** One goal's material demand within a priority-shared plan estimate (`estimatePlan`). */
export interface GoalNeed {
  goalId: string
  /** Per-project priority — lower runs first and claims shared inventory/energy ahead of higher
   *  numbers, mirroring `project_goals.priority` (plan §5). */
  priority: number
  needs: MaterialNeed[]
  /** Restricts farming to these battle ids when set (goal's `config.farmingLocationIds`); otherwise
   *  the engine auto-selects the least-energy node(s) per material. */
  farmingLocationIds?: readonly string[] | null
}

export interface EstimateResult {
  /** Days of farming until every material need is met. */
  days: number
  /** ISO `yyyy-mm-dd` completion date, `days` after the estimate's reference date. */
  date: string
  energyTotal: number
  raidsTotal: number
}

export type { Battle, FarmLocation }
