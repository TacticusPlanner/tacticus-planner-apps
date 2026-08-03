import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  CountedResourceNeed,
  EstimateResourceId,
  EstimateOutcome,
  EstimateUpgrade,
  FarmLocation,
  FarmNode,
  GoalInventoryAllocation,
  GoalNeed,
  InventoryAllocationGoal,
  RaidBreakdownEntry,
  UpgradeNeed,
} from "../model/estimate.domain"
import { blocked, unavailableReason } from ".//estimate-blocked"

// Day-by-day resource estimation engine — a "core scheduler" port of V1's
// `UpgradesService.generateDailyRaidsList` (day loop budgeting energy against campaign nodes) and
// `GoalsService.computeMaterialQuantityInfo` (priority-ordered shared-inventory allocation). Handles
// upgrade materials and (plan §16 phase 7) farmable character shards via `EstimateResourceId`; orbs,
// mythic shards, onslaught tokens, home-screen-event scoring, and XP-tome accrual have no
// campaign-node farm source and are deferred fidelity, not ported.
//
// Single-consumer, i18n-free, pure functions — colocated under `pages/goals` rather than in a
// `features/*` slice, since a feature cannot import another feature (`features/rank-lookup`) under
// this repo's FSD rules; callers derive `needs`/`inventory` via
// `features/rank-lookup/lib/rank-lookup-calc.ts` and pass the pre-aggregated result in.

/** V1's guard against a farm that can never complete (e.g. zero daily energy, or every candidate
 *  node priced out of the daily budget) looping forever. */
const MAX_DAYS = 1000

/**
 * The chance a single run drops this location's material: 1 for a guaranteed drop, the precomputed
 * `effectiveRate` when present, else the raw `numerator/denominator` fraction, else 0. Duplicated
 * from `@/shared/lib`'s `campaign-insights.ts` rather than imported, per this codebase's cross-file
 * duplication convention for small pure helpers.
 */
export function dropRate(location: FarmLocation): number {
  if (location.guaranteed) return 1
  if (location.effectiveRate != null) return location.effectiveRate
  if (location.numerator != null && location.denominator) {
    return location.numerator / location.denominator
  }
  return 0
}

/**
 * The farm node(s) to raid for one material need: every location restricted to `farmingLocationIds`
 * when the goal pins specific nodes, otherwise the least-`energyPerItem` node(s) across all its drop
 * locations (a port of V1 `CampaignsService.selectBestLocations`). Locations with no energy cost or
 * no drop chance are never selectable. Empty when the material can't be farmed at all.
 */
export function selectFarmNodes(
  need: UpgradeNeed,
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  farmingLocationIds?: readonly string[] | null
): FarmNode[] {
  const upgrade = upgradesById.get(need.id)
  if (!upgrade) return []

  const restricted = farmingLocationIds && farmingLocationIds.length > 0

  const candidates: FarmNode[] = []
  for (const location of upgrade.farmLocations) {
    const battle = battlesById.get(location.battleId)
    if (!battle || battle.energyCost <= 0) continue

    const rate = dropRate(location)
    if (rate <= 0) continue

    if (restricted && !farmingLocationIds.includes(location.battleId)) continue

    candidates.push({
      battleId: location.battleId,
      energyCost: battle.energyCost,
      dropRate: rate,
      dailyAttempts: battle.dailyAttempts,
    })
  }

  if (candidates.length === 0 || restricted) return candidates

  const minEnergyPerItem = Math.min(
    ...candidates.map((c) => c.energyCost / c.dropRate)
  )
  return candidates.filter(
    (c) => c.energyCost / c.dropRate === minEnergyPerItem
  )
}

export function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime())
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Spends one day's energy against a goal's still-remaining materials, cheapest node first, mutating
 * `remaining` and returning the energy/raids spent. Shared by `estimateGoal` (one goal) and
 * `estimatePlan` (each goal's turn within a combined day), so both loops spend a day identically.
 * Each battle node's `dailyAttempts` cap is tracked per `battleId` across the whole call (not per
 * material) — it's the same real-world battle regardless of which material happens to drop there, so
 * two different materials farmed from the same node share one daily cap rather than each getting a
 * fresh one.
 */
export function spendDay(
  remaining: Map<EstimateResourceId, number>,
  nodesById: ReadonlyMap<EstimateResourceId, FarmNode[]>,
  startingEnergy: number,
  attemptsUsedByBattle = new Map<BattleId, number>()
): {
  energySpent: number
  raidsPerformed: number
  breakdown: Omit<RaidBreakdownEntry, "goalId">[]
  attemptsUsedByBattle: Map<BattleId, number>
} {
  let energy = startingEnergy
  let energySpent = 0
  let raidsPerformed = 0
  const breakdown: Omit<RaidBreakdownEntry, "goalId">[] = []

  const spendable = [...remaining.entries()]
    .flatMap(([id]) => (nodesById.get(id) ?? []).map((node) => ({ id, node })))
    .sort((a, b) => a.node.energyCost - b.node.energyCost)

  for (const { id, node } of spendable) {
    const remainingCount = remaining.get(id)
    if (!remainingCount || remainingCount <= 0) continue
    if (energy < node.energyCost) continue

    const attemptsUsed = attemptsUsedByBattle.get(node.battleId) ?? 0
    const attemptsCap = node.dailyAttempts > 0 ? node.dailyAttempts : Infinity
    const attemptsRemaining = attemptsCap - attemptsUsed
    if (attemptsRemaining <= 0) continue

    const affordableRaids = Math.floor(energy / node.energyCost)
    const neededRaids = Math.ceil(remainingCount / node.dropRate)
    const raidsToPerform = Math.min(
      affordableRaids,
      neededRaids,
      attemptsRemaining
    )
    if (raidsToPerform <= 0) continue

    const farmed = raidsToPerform * node.dropRate
    const spent = raidsToPerform * node.energyCost
    energy -= spent
    energySpent += spent
    raidsPerformed += raidsToPerform
    attemptsUsedByBattle.set(node.battleId, attemptsUsed + raidsToPerform)
    breakdown.push({
      resourceId: id,
      battleId: node.battleId,
      raidsPerformed: raidsToPerform,
      itemsFarmed: farmed,
      energySpent: spent,
      dailyAttempts: node.dailyAttempts,
    })

    const nextRemaining = remainingCount - farmed
    if (nextRemaining <= 0) {
      remaining.delete(id)
    } else {
      remaining.set(id, nextRemaining)
    }
  }

  return {
    energySpent,
    raidsPerformed,
    breakdown,
    attemptsUsedByBattle,
  }
}

/**
 * Isolated single-goal estimate (plan §9 context (a), the creation preview): how many days of
 * `dailyEnergy` farming clear every material in `needs`, assuming no other goal competes for energy
 * or inventory. Returns `null` when any material has no farmable location, or the farm can't clear
 * within `MAX_DAYS` (e.g. `dailyEnergy` too low to ever afford the cheapest node) — both "can't
 * estimate this" rather than a misleading number.
 */
export function estimateGoal({
  needs,
  upgradesById,
  battlesById,
  dailyEnergy,
  farmingLocationIds,
  referenceDate = new Date(),
}: {
  needs: UpgradeNeed[]
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  dailyEnergy: number
  farmingLocationIds?: readonly string[] | null
  referenceDate?: Date
}): EstimateOutcome {
  const remaining = new Map<EstimateResourceId, number>()
  const nodesById = new Map<EstimateResourceId, FarmNode[]>()

  for (const need of needs) {
    if (need.count <= 0) continue
    const unavailable = unavailableReason(
      need,
      upgradesById,
      battlesById,
      farmingLocationIds,
      dailyEnergy
    )
    if (unavailable) return blocked(unavailable, [need.id])
    const nodes = selectFarmNodes(
      need,
      upgradesById,
      battlesById,
      farmingLocationIds
    )
    if (nodes.length === 0) {
      return blocked(
        unavailableReason(
          need,
          upgradesById,
          battlesById,
          farmingLocationIds,
          dailyEnergy
        ) ?? "NoFarmLocation",
        [need.id]
      )
    }
    remaining.set(need.id, need.count)
    nodesById.set(need.id, nodes)
  }

  if (remaining.size === 0) {
    return {
      status: "Estimated",
      days: 0,
      date: formatDate(referenceDate),
      energyTotal: 0,
      raidsTotal: 0,
    }
  }

  let days = 0
  let energyTotal = 0
  let raidsTotal = 0

  while (remaining.size > 0 && days < MAX_DAYS) {
    days++
    const { energySpent, raidsPerformed } = spendDay(
      remaining,
      nodesById,
      dailyEnergy
    )
    energyTotal += energySpent
    raidsTotal += raidsPerformed
  }

  return remaining.size > 0
    ? blocked("SimulationLimit", [...remaining.keys()])
    : {
        status: "Estimated",
        days,
        date: formatDate(addDays(referenceDate, days)),
        energyTotal,
        raidsTotal,
      }
}

/**
 * Priority-shared plan estimate (plan §9 context (b), §5's per-project priority): given every Rank
 * goal in a project (ordered by `priority`, lower runs first) and the shared upgrade `inventory`,
 * returns each goal's completion estimate accounting for (1) higher-priority goals claiming shared
 * inventory first — a port of V1 `GoalsService.computeMaterialQuantityInfo` — and (2) a single
 * combined day loop where each day's energy is spent goal-by-goal in priority order (V1's default
 * `goalPriority` farm order), so a higher-priority goal's farming isn't slowed by a lower-priority
 * goal's competing needs. A goal's value is `null` when it can never complete (see `estimateGoal`).
 */
export function allocateInventory<TId extends string>(
  goals: readonly InventoryAllocationGoal<TId>[],
  inventory: readonly CountedResourceNeed<TId>[]
): Map<string, GoalInventoryAllocation<TId>> {
  const held = new Map<TId, number>(
    inventory.map((entry) => [entry.id, entry.count])
  )
  const allocations = new Map<string, GoalInventoryAllocation<TId>>()

  for (const goal of [...goals].sort((a, b) => a.priority - b.priority)) {
    const sourceStages = goal.stages?.length
      ? goal.stages
      : [{ target: "final", needs: goal.needs }]
    const stages = sourceStages.map((sourceStage) => {
      const remaining: CountedResourceNeed<TId>[] = []
      for (const need of sourceStage.needs) {
        const available = held.get(need.id) ?? 0
        const consumed = Math.min(available, need.count)
        if (consumed > 0) held.set(need.id, available - consumed)
        const stillNeeded = need.count - consumed
        if (stillNeeded > 0) remaining.push({ ...need, count: stillNeeded })
      }
      return {
        target: sourceStage.target,
        needs: sourceStage.needs.map((need) => ({ ...need })),
        remaining,
      }
    })
    allocations.set(goal.goalId, { goalId: goal.goalId, stages })
  }

  return allocations
}

export function allocatePlanInventory(
  goals: readonly GoalNeed[],
  inventory: readonly UpgradeNeed[]
): Map<string, GoalInventoryAllocation> {
  return allocateInventory(goals, inventory)
}
