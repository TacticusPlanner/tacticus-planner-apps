import { holdsGlobalPosition } from "@/entities/goal"

import type { GoalRow } from "./types"
import { firstDifference } from "@/shared/lib"

/**
 * The Goals page's one order (spec: `goals-navigation`): goals that hold a position in the global
 * order (Active/Paused) by that position, then every other goal (reached, completed, archived), most
 * recently updated first. The Finish date sort (`orderRowsByFinishDate`) reorders this list.
 */
export function orderRowsByGlobalPriority(rows: readonly GoalRow[]): GoalRow[] {
  return rows.toSorted((left, right) => {
    const leftHeld = holdsGlobalPosition(left)
    const rightHeld = holdsGlobalPosition(right)
    if (leftHeld !== rightHeld) return leftHeld ? -1 : 1
    if (leftHeld) {
      return (
        (left.priority ?? Number.MAX_SAFE_INTEGER) -
        (right.priority ?? Number.MAX_SAFE_INTEGER)
      )
    }
    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

/**
 * The Finish date sort: rows with an estimated finish date in the priority plan, soonest first,
 * then the rest (blocked, reached or not estimated yet) in their incoming order. Ties keep the
 * incoming (priority) order, so pass rows already in priority order.
 */
export function orderRowsByFinishDate(
  rows: readonly GoalRow[],
  finishDays: ReadonlyMap<string, { days?: number }>
): GoalRow[] {
  return orderRowsByDays(rows, (row) => finishDays.get(row.goalId)?.days)
}

/**
 * The Duration sort: rows by their days of raids once they start getting energy (first raid day →
 * done, `goalRaidDuration`), shortest first, then the rest (no raids, blocked, reached or not
 * estimated yet) in their incoming order. Ties keep the incoming (priority) order.
 */
export function orderRowsByDuration(
  rows: readonly GoalRow[],
  durationOf: (goalId: string) => number | undefined
): GoalRow[] {
  return orderRowsByDays(rows, (row) => durationOf(row.goalId))
}

function orderRowsByDays(
  rows: readonly GoalRow[],
  daysOf: (row: GoalRow) => number | undefined
): GoalRow[] {
  return rows
    .map((row, index) => ({ row, index, days: daysOf(row) }))
    .toSorted((left, right) => {
      if (left.days === undefined || right.days === undefined) {
        if (left.days !== right.days) return left.days === undefined ? 1 : -1
        return left.index - right.index
      }
      return firstDifference(left.days - right.days, left.index - right.index)
    })
    .map((entry) => entry.row)
}
