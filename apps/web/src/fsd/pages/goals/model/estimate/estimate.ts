import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateResourceId,
  EstimateOutcome,
  EstimateUpgrade,
  FarmLocation,
  FarmNode,
  GoalNeed,
  MaterialNeed,
} from "./estimate.domain"
import { blocked, unavailableReason } from "./estimate-blocked"

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
  need: MaterialNeed,
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

function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime())
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Spends one day's energy against a goal's still-remaining materials, cheapest node first, mutating
 * `remaining` and returning the energy/raids spent. Shared by `estimateGoal` (one goal) and
 * `estimatePlan` (each goal's turn within a combined day), so both loops spend a day identically.
 */
function spendDay(
  remaining: Map<EstimateResourceId, number>,
  nodesById: ReadonlyMap<EstimateResourceId, FarmNode[]>,
  startingEnergy: number
): { energySpent: number; raidsPerformed: number } {
  let energy = startingEnergy
  let energySpent = 0
  let raidsPerformed = 0

  const spendable = [...remaining.entries()]
    .flatMap(([id]) => (nodesById.get(id) ?? []).map((node) => ({ id, node })))
    .sort((a, b) => a.node.energyCost - b.node.energyCost)

  for (const { id, node } of spendable) {
    const remainingCount = remaining.get(id)
    if (!remainingCount || remainingCount <= 0) continue
    if (energy < node.energyCost) continue

    const affordableRaids = Math.floor(energy / node.energyCost)
    const neededRaids = Math.ceil(remainingCount / node.dropRate)
    const raidsToPerform = Math.min(affordableRaids, neededRaids)
    if (raidsToPerform <= 0) continue

    const farmed = raidsToPerform * node.dropRate
    const spent = raidsToPerform * node.energyCost
    energy -= spent
    energySpent += spent
    raidsPerformed += raidsToPerform

    const nextRemaining = remainingCount - farmed
    if (nextRemaining <= 0) {
      remaining.delete(id)
    } else {
      remaining.set(id, nextRemaining)
    }
  }

  return { energySpent, raidsPerformed }
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
  needs: MaterialNeed[]
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
export function estimatePlan({
  goals,
  upgradesById,
  battlesById,
  dailyEnergy,
  inventory,
  ordering = "GoalPriority",
  referenceDate = new Date(),
}: {
  goals: GoalNeed[]
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  dailyEnergy: number
  inventory: MaterialNeed[]
  ordering?: "GoalPriority" | "TotalMaterials"
  referenceDate?: Date
}): Map<string, EstimateOutcome> {
  const ordered = [...goals].sort((a, b) => a.priority - b.priority)

  // Step 1: higher-priority goals consume shared inventory first; only the leftover need continues
  // into the farming simulation below.
  const held = new Map<EstimateResourceId, number>(
    inventory.map((entry) => [entry.id, entry.count])
  )
  const remainingByGoal = new Map<string, Map<EstimateResourceId, number>>()
  const nodesByGoal = new Map<string, Map<EstimateResourceId, FarmNode[]>>()
  const results = new Map<string, EstimateOutcome>()

  for (const goal of ordered) {
    const remaining = new Map<EstimateResourceId, number>()
    const nodesById = new Map<EstimateResourceId, FarmNode[]>()
    let blockedOutcome: EstimateOutcome | null = null

    for (const need of goal.needs) {
      const available = held.get(need.id) ?? 0
      const consumed = Math.min(available, need.count)
      if (consumed > 0) held.set(need.id, available - consumed)

      const stillNeeded = need.count - consumed
      if (stillNeeded <= 0) continue

      const unavailable = unavailableReason(
        need,
        upgradesById,
        battlesById,
        goal.farmingLocationIds,
        dailyEnergy
      )
      if (unavailable) {
        blockedOutcome = blocked(unavailable, [need.id])
        break
      }

      const nodes = selectFarmNodes(
        { id: need.id, count: stillNeeded },
        upgradesById,
        battlesById,
        goal.farmingLocationIds
      )
      if (nodes.length === 0) {
        blockedOutcome = blocked(
          unavailableReason(
            need,
            upgradesById,
            battlesById,
            goal.farmingLocationIds,
            dailyEnergy
          ) ?? "NoFarmLocation",
          [need.id]
        )
        break
      }
      remaining.set(need.id, stillNeeded)
      nodesById.set(need.id, nodes)
    }

    if (blockedOutcome) {
      results.set(goal.goalId, blockedOutcome)
      continue
    }
    if (remaining.size === 0) {
      results.set(goal.goalId, {
        status: "Estimated",
        days: 0,
        date: formatDate(referenceDate),
        energyTotal: 0,
        raidsTotal: 0,
      })
      continue
    }

    remainingByGoal.set(goal.goalId, remaining)
    nodesByGoal.set(goal.goalId, nodesById)
  }

  if (ordering === "TotalMaterials") {
    return estimatePooledPlan({
      ordered,
      remainingByGoal,
      nodesByGoal,
      results,
      dailyEnergy,
      referenceDate,
    })
  }

  // Step 2: one combined day loop. Each day, every still-pending goal (in priority order) spends
  // against the same shared daily energy budget in turn, so goal N only sees what priority 1..N-1
  // left over that day.
  let days = 0
  const pending = new Set(remainingByGoal.keys())
  const energyTotalByGoal = new Map<string, number>(
    [...pending].map((id) => [id, 0])
  )
  const raidsTotalByGoal = new Map<string, number>(
    [...pending].map((id) => [id, 0])
  )

  while (pending.size > 0 && days < MAX_DAYS) {
    days++
    let energy = dailyEnergy

    for (const goal of ordered) {
      if (!pending.has(goal.goalId) || energy <= 0) continue

      const remaining = remainingByGoal.get(goal.goalId)!
      const nodesById = nodesByGoal.get(goal.goalId)!
      const { energySpent, raidsPerformed } = spendDay(
        remaining,
        nodesById,
        energy
      )
      energy -= energySpent
      energyTotalByGoal.set(
        goal.goalId,
        (energyTotalByGoal.get(goal.goalId) ?? 0) + energySpent
      )
      raidsTotalByGoal.set(
        goal.goalId,
        (raidsTotalByGoal.get(goal.goalId) ?? 0) + raidsPerformed
      )

      if (remaining.size === 0) {
        results.set(goal.goalId, {
          status: "Estimated",
          days,
          date: formatDate(addDays(referenceDate, days)),
          energyTotal: energyTotalByGoal.get(goal.goalId) ?? 0,
          raidsTotal: raidsTotalByGoal.get(goal.goalId) ?? 0,
        })
        pending.delete(goal.goalId)
      }
    }
  }

  for (const goalId of pending) {
    results.set(
      goalId,
      blocked("SimulationLimit", [
        ...(remainingByGoal.get(goalId)?.keys() ?? []),
      ])
    )
  }

  return results
}

function estimatePooledPlan({
  ordered,
  remainingByGoal,
  nodesByGoal,
  results,
  dailyEnergy,
  referenceDate,
}: {
  ordered: GoalNeed[]
  remainingByGoal: Map<string, Map<EstimateResourceId, number>>
  nodesByGoal: Map<string, Map<EstimateResourceId, FarmNode[]>>
  results: Map<string, EstimateOutcome>
  dailyEnergy: number
  referenceDate: Date
}): Map<string, EstimateOutcome> {
  const totals = new Map<EstimateResourceId, number>()
  const pooledNodes = new Map<EstimateResourceId, FarmNode[]>()
  for (const goal of ordered) {
    const remaining = remainingByGoal.get(goal.goalId)
    if (!remaining) continue
    for (const [id, count] of remaining) {
      totals.set(id, (totals.get(id) ?? 0) + count)
      if (!pooledNodes.has(id)) {
        pooledNodes.set(id, nodesByGoal.get(goal.goalId)?.get(id) ?? [])
      }
    }
  }
  // Resource selection must not inherit project priority. A stable resource-id order makes the
  // pooled farm deterministic even when callers reorder goals or change their priorities.
  const pooled = new Map(
    [...totals].sort(([left], [right]) =>
      String(left).localeCompare(String(right))
    )
  )

  const pending = new Set(remainingByGoal.keys())
  let days = 0
  let energyTotal = 0
  let raidsTotal = 0

  while (pending.size > 0 && days < MAX_DAYS) {
    days++
    const before = new Map(pooled)
    const spent = spendDay(pooled, pooledNodes, dailyEnergy)
    if (spent.energySpent === 0) break
    energyTotal += spent.energySpent
    raidsTotal += spent.raidsPerformed

    for (const [id, oldCount] of before) {
      let acquired = oldCount - (pooled.get(id) ?? 0)
      if (acquired <= 0) continue
      for (const goal of ordered) {
        if (!pending.has(goal.goalId)) continue
        const remaining = remainingByGoal.get(goal.goalId)!
        const needed = remaining.get(id) ?? 0
        if (needed <= 0) continue
        const applied = Math.min(needed, acquired)
        const next = needed - applied
        if (next <= 0) remaining.delete(id)
        else remaining.set(id, next)
        acquired -= applied
        if (remaining.size === 0) {
          results.set(goal.goalId, {
            status: "Estimated",
            days,
            date: formatDate(addDays(referenceDate, days)),
            energyTotal,
            raidsTotal,
          })
          pending.delete(goal.goalId)
        }
        if (acquired <= 0) break
      }
    }
  }

  for (const goalId of pending) {
    results.set(
      goalId,
      blocked("SimulationLimit", [
        ...(remainingByGoal.get(goalId)?.keys() ?? []),
      ])
    )
  }
  return results
}
