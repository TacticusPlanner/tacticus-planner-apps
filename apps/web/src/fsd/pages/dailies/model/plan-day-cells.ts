import type { BattleId } from "@workspace/game-domain"

import {
  dailyRaidResourceKey,
  type DailyRaidGoalViewModel,
  type DailyRaidsReadyViewModel,
} from "@/features/daily-raids"
import type { RaidDaySchedule } from "@/features/goal-farming"

export type PlanCell = {
  resourceId: string
  // Summed across the distinct goals the cell serves, at the start of the day.
  owned: number
  target: number
  // Distinct by unit (a unit with two goals counts once), in goal-priority order.
  units: DailyRaidGoalViewModel[]
  nodes: { battleId: BattleId; raidsPerformed: number }[]
}

export type PlanDayCells = {
  day: number
  actionable: PlanCell[]
  raided: PlanCell[]
  // Distinct units of the actionable cells, in goal-priority order.
  units: DailyRaidGoalViewModel[]
}

type PlanSource = Pick<
  DailyRaidsReadyViewModel,
  "goalsById" | "resourceProgressByDay" | "attemptsLeftByBattle"
>

const UNKNOWN_GOAL_PRIORITY = Number.MAX_SAFE_INTEGER

/** Merges a day's per-goal entries into one cell per material and splits them by V1's Raided rule. */
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

  const units = new Map<string, DailyRaidGoalViewModel>()
  for (const cell of actionable) {
    for (const unit of cell.units) {
      if ((units.get(unit.unitId)?.priority ?? Infinity) > unit.priority)
        units.set(unit.unitId, unit)
    }
  }
  return {
    day: day.day,
    actionable,
    raided,
    units: [...units.values()].sort((a, b) => a.priority - b.priority),
  }
}

export type PlanUnitRange = {
  unit: DailyRaidGoalViewModel
  firstDay: number
  lastDay: number
}

/** Filter-bar units (goal-priority order) with the first/last day each has an actionable cell, across
 * every plan day — including days the strip hasn't revealed yet. */
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
