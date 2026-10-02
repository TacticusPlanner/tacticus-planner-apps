import { dailyRaidResourceKey } from "./daily-raids.domain"
import type { BattleId } from "@workspace/game-domain"

import type {
  DailyRaidGoalViewModel,
  DailyRaidsReadyViewModel,
} from "./daily-raids.domain"
import type { RaidDaySchedule } from "@/features/goal-farming/@x/daily-raids"

export type PlanCell = {
  resourceId: string
  // Summed across the distinct goals the cell serves, at the start of the day.
  owned: number
  target: number
  // Distinct by unit (a unit with two goals counts once), in goal-priority order.
  units: DailyRaidGoalViewModel[]
  nodes: { battleId: BattleId; raidsPerformed: number }[]
}

/** One unit's projected purchases of one shop offer on one day (spec: day cards list shop purchases
 *  after the raided materials) — merged across the unit's goals. Expected values, unrounded: the view
 *  rounds once for display. */
export type PlanShopPurchase = {
  offerId: string
  shopId: string
  /** `shards_<unit>` / `mythicShards_<unit>`, or a Mythic upgrade-material id. */
  rewardType: string
  unit: DailyRaidGoalViewModel
  purchases: number
  /** Expected shards, or Mythic-material items for a material offer. */
  amount: number
  currency: string
  spend: number
}

/** One unit's projected Onslaught runs on one day (spec: day cards list Onslaught runs after the shop
 *  purchases) — merged across the unit's goals. Expected values, unrounded. */
export type PlanOnslaughtRun = {
  unit: DailyRaidGoalViewModel
  runs: number
  shards: number
}

export type PlanDayCells = {
  day: number
  actionable: PlanCell[]
  raided: PlanCell[]
  // Shop purchases in goal-priority order of their unit, then by offer id.
  shops: PlanShopPurchase[]
  // Onslaught runs in goal-priority order of their unit.
  onslaught: PlanOnslaughtRun[]
  // Distinct units of the actionable cells, shop purchases and Onslaught runs, in goal-priority order.
  units: DailyRaidGoalViewModel[]
}

type PlanSource = Pick<
  DailyRaidsReadyViewModel,
  | "goalsById"
  | "resourceProgressByDay"
  | "attemptsLeftByBattle"
  | "shopOffersById"
>

function buildShopPurchases(
  day: RaidDaySchedule,
  source: PlanSource
): PlanShopPurchase[] {
  const byKey = new Map<string, PlanShopPurchase>()
  for (const entry of day.shopEntries) {
    const offer = source.shopOffersById.get(entry.offerId)
    const unit = source.goalsById.get(entry.goalId)
    if (!offer || !unit) continue
    const key = `${entry.offerId}|${unit.unitId}`
    const purchase = byKey.get(key) ?? {
      offerId: offer.offerId,
      shopId: offer.shopId,
      rewardType: offer.rewardType,
      unit,
      purchases: 0,
      amount: 0,
      currency: offer.cost.currency,
      spend: 0,
    }
    const purchases = entry.expectedAmount / offer.rewardQty
    purchase.purchases += purchases
    purchase.amount += entry.expectedAmount
    purchase.spend += purchases * offer.cost.amount
    if (unit.priority < purchase.unit.priority) purchase.unit = unit
    byKey.set(key, purchase)
  }
  return [...byKey.values()].sort(
    (a, b) =>
      a.unit.priority - b.unit.priority || a.offerId.localeCompare(b.offerId)
  )
}

const UNKNOWN_GOAL_PRIORITY = Number.MAX_SAFE_INTEGER

/** Merges a day's per-goal entries into one cell per material and splits them by V1's Raided rule. */
function buildOnslaughtRuns(
  day: RaidDaySchedule,
  source: PlanSource
): PlanOnslaughtRun[] {
  const byUnit = new Map<string, PlanOnslaughtRun>()
  for (const entry of day.onslaughtEntries) {
    const unit = source.goalsById.get(entry.goalId)
    if (!unit) continue
    const run = byUnit.get(unit.unitId) ?? { unit, runs: 0, shards: 0 }
    run.runs += entry.runs
    run.shards += entry.expectedShards
    if (unit.priority < run.unit.priority) run.unit = unit
    byUnit.set(unit.unitId, run)
  }
  return [...byUnit.values()].sort((a, b) => a.unit.priority - b.unit.priority)
}

export function buildPlanDayCells(
  day: RaidDaySchedule,
  source: PlanSource
): PlanDayCells {
  const progress = source.resourceProgressByDay.get(day.day)
  const byResource = new Map<
    string,
    { goalIds: Set<string>; nodes: Map<BattleId, number> }
  >()
  for (const entry of day.entries) {
    const group = byResource.get(entry.resourceId) ?? {
      goalIds: new Set<string>(),
      nodes: new Map<BattleId, number>(),
    }
    group.goalIds.add(entry.goalId)
    group.nodes.set(
      entry.battleId,
      (group.nodes.get(entry.battleId) ?? 0) + entry.raidsPerformed
    )
    byResource.set(entry.resourceId, group)
  }

  const priorityOf = (goalId: string) =>
    source.goalsById.get(goalId)?.priority ?? UNKNOWN_GOAL_PRIORITY

  const cells = [...byResource.entries()].map(
    ([resourceId, { goalIds, nodes }], index) => {
      let owned = 0
      let target = 0
      for (const goalId of goalIds) {
        const value = progress?.get(dailyRaidResourceKey(goalId, resourceId))
        owned += value?.owned ?? 0
        target += value?.target ?? 0
      }
      const units = new Map<string, DailyRaidGoalViewModel>()
      for (const goalId of [...goalIds].sort(
        (a, b) => priorityOf(a) - priorityOf(b)
      )) {
        const goal = source.goalsById.get(goalId)
        if (goal && !units.has(goal.unitId)) units.set(goal.unitId, goal)
      }
      const cell: PlanCell = {
        resourceId,
        owned,
        target,
        units: [...units.values()],
        nodes: [...nodes].map(([battleId, raidsPerformed]) => ({
          battleId,
          raidsPerformed,
        })),
      }
      return {
        cell,
        index,
        priority: Math.min(...[...goalIds].map(priorityOf)),
      }
    }
  )
  // `index` keeps the engine's own emission order for cells serving the same priority.
  cells.sort((a, b) => a.priority - b.priority || a.index - b.index)

  const actionable: PlanCell[] = []
  const raided: PlanCell[] = []
  for (const { cell } of cells) {
    const exhausted =
      day.day === 1 &&
      cell.nodes.every(
        (node) => source.attemptsLeftByBattle.get(node.battleId) === 0
      )
    ;(cell.owned >= cell.target || exhausted ? raided : actionable).push(cell)
  }

  const shops = buildShopPurchases(day, source)
  const onslaught = buildOnslaughtRuns(day, source)
  const units = new Map<string, DailyRaidGoalViewModel>()
  for (const unit of [
    ...actionable.flatMap((cell) => cell.units),
    ...shops.map((purchase) => purchase.unit),
    ...onslaught.map((run) => run.unit),
  ]) {
    if ((units.get(unit.unitId)?.priority ?? Infinity) > unit.priority)
      units.set(unit.unitId, unit)
  }
  return {
    day: day.day,
    actionable,
    raided,
    shops,
    onslaught,
    units: [...units.values()].sort((a, b) => a.priority - b.priority),
  }
}

export type PlanUnitRange = {
  unit: DailyRaidGoalViewModel
  firstDay: number
  lastDay: number
}

/** Filter-bar units (goal-priority order) with the first/last day each has an actionable cell, across
 * every plan day вЂ” including days the strip hasn't revealed yet. */
export function buildPlanUnitRanges(days: PlanDayCells[]): PlanUnitRange[] {
  const ranges = new Map<string, PlanUnitRange>()
  for (const { day, units } of days) {
    for (const unit of units) {
      const range = ranges.get(unit.unitId)
      if (!range) ranges.set(unit.unitId, { unit, firstDay: day, lastDay: day })
      else {
        if (unit.priority < range.unit.priority) range.unit = unit
        range.firstDay = Math.min(range.firstDay, day)
        range.lastDay = Math.max(range.lastDay, day)
      }
    }
  }
  return [...ranges.values()].sort((a, b) => a.unit.priority - b.unit.priority)
}
