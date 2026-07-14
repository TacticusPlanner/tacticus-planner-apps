import type { BattleId, UpgradeId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateResult,
  EstimateUpgrade,
  FarmLocation,
  FarmNode,
  GoalNeed,
  MaterialNeed,
} from "./estimate.domain"

// Day-by-day resource estimation engine — a "core scheduler" port of V1's
// `UpgradesService.generateDailyRaidsList` (day loop budgeting energy against campaign nodes) and
// `GoalsService.computeMaterialQuantityInfo` (priority-ordered shared-inventory allocation), scoped
// to Rank/Upgrade goals only (plan §16 phase 4 scope notes — Ascension/Unlock/Shards need a
// shard-cost data port V2 doesn't have yet; onslaught tokens, home-screen-event scoring, and
// XP-tome/orb accrual are deferred fidelity, not ported).
//
// Single-consumer, i18n-free, pure functions — colocated under `pages/goals` (like
// `pages/lookup/.../campaign-insights.ts`) rather than in a `features/*` slice, since a feature
// cannot import another feature (`features/rank-lookup`) under this repo's FSD rules; callers derive
// `needs`/`inventory` via `features/rank-lookup/lib/rank-lookup-calc.ts` and pass the pre-aggregated
// result in.

/** V1's guard against a farm that can never complete (e.g. zero daily energy, or every candidate
 *  node priced out of the daily budget) looping forever. */
const MAX_DAYS = 1000

/**
 * The chance a single run drops this location's material: 1 for a guaranteed drop, the precomputed
 * `effectiveRate` when present, else the raw `numerator/denominator` fraction, else 0. Duplicated
 * from `pages/lookup/.../campaign-insights.ts` (a page, so not importable) rather than shared, per
 * this codebase's cross-page duplication convention.
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
  upgradesById: ReadonlyMap<UpgradeId, EstimateUpgrade>,
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
  remaining: Map<UpgradeId, number>,
  nodesById: ReadonlyMap<UpgradeId, FarmNode[]>,
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
  upgradesById: ReadonlyMap<UpgradeId, EstimateUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  dailyEnergy: number
  farmingLocationIds?: readonly string[] | null
  referenceDate?: Date
}): EstimateResult | null {
  const remaining = new Map<UpgradeId, number>()
  const nodesById = new Map<UpgradeId, FarmNode[]>()

  for (const need of needs) {
    if (need.count <= 0) continue
    const nodes = selectFarmNodes(
      need,
      upgradesById,
      battlesById,
      farmingLocationIds
    )
    if (nodes.length === 0) return null
    remaining.set(need.id, need.count)
    nodesById.set(need.id, nodes)
  }

  if (remaining.size === 0) {
    return {
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
    ? null
    : {
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
  referenceDate = new Date(),
}: {
  goals: GoalNeed[]
  upgradesById: ReadonlyMap<UpgradeId, EstimateUpgrade>
  battlesById: ReadonlyMap<BattleId, Battle>
  dailyEnergy: number
  inventory: MaterialNeed[]
  referenceDate?: Date
}): Map<string, EstimateResult | null> {
  const ordered = [...goals].sort((a, b) => a.priority - b.priority)

  // Step 1: higher-priority goals consume shared inventory first; only the leftover need continues
  // into the farming simulation below.
  const held = new Map<UpgradeId, number>(
    inventory.map((entry) => [entry.id, entry.count])
  )
  const remainingByGoal = new Map<string, Map<UpgradeId, number>>()
  const nodesByGoal = new Map<string, Map<UpgradeId, FarmNode[]>>()
  const results = new Map<string, EstimateResult | null>()

  for (const goal of ordered) {
    const remaining = new Map<UpgradeId, number>()
    const nodesById = new Map<UpgradeId, FarmNode[]>()
    let unreachable = false

    for (const need of goal.needs) {
      const available = held.get(need.id) ?? 0
      const consumed = Math.min(available, need.count)
      if (consumed > 0) held.set(need.id, available - consumed)

      const stillNeeded = need.count - consumed
      if (stillNeeded <= 0) continue

      const nodes = selectFarmNodes(
        { id: need.id, count: stillNeeded },
        upgradesById,
        battlesById,
        goal.farmingLocationIds
      )
      if (nodes.length === 0) {
        unreachable = true
        break
      }
      remaining.set(need.id, stillNeeded)
      nodesById.set(need.id, nodes)
    }

    if (unreachable) {
      results.set(goal.goalId, null)
      continue
    }
    if (remaining.size === 0) {
      results.set(goal.goalId, {
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
    results.set(goalId, null)
  }

  return results
}
