import { holdsGlobalPosition } from "@/entities/goal"

/** The goal each row-menu move would displace (`GoalOrderMove.displacedGoalId`); a direction with
 *  no target is not offered. */
export type GoalMenuMoves = {
  top?: string
  up?: string
  down?: string
  /** Every in-flight goal in account-wide priority order (priority N is index N - 1), shared by all
   *  rows: the targets "Move to priority…" picks from. Absent when that item is not offered. */
  priorityOrder?: readonly string[]
}

/**
 * Row-menu priority moves (Move to top / up / down) for the visible rows, keyed by goal id. A move
 * steps over the neighbouring in-flight goal in priority order among the rows the filters show,
 * ignoring Group, so a move can cross a group boundary that a drag cannot. Hidden goals keep their
 * relative order, exactly as for a drop. Move to top is left out where it would equal Move up.
 * With `priorityOrder` (the complete in-flight order), each visible in-flight row also gets it as
 * the targets of "Move to priority…", even when the filters show that row alone.
 */
export function goalMenuMoves(
  visibleRows: readonly { goalId: string; status: string }[],
  priorityOrder?: readonly string[]
): Map<string, GoalMenuMoves> {
  const ids = visibleRows.filter(holdsGlobalPosition).map((row) => row.goalId)
  const moves = new Map<string, GoalMenuMoves>()
  const byPriority =
    priorityOrder && priorityOrder.length > 1 ? priorityOrder : undefined
  if (ids.length < 2 && !byPriority) return moves
  ids.forEach((goalId, index) => {
    const neighbours =
      ids.length < 2
        ? {}
        : {
            top: index > 1 ? ids[0] : undefined,
            up: index > 0 ? ids[index - 1] : undefined,
            down: index < ids.length - 1 ? ids[index + 1] : undefined,
          }
    moves.set(
      goalId,
      byPriority?.includes(goalId)
        ? { ...neighbours, priorityOrder: byPriority }
        : neighbours
    )
  })
  return moves
}

/**
 * The goal "Move to priority…" displaces so `goalId` lands at `priority` (1-based) in
 * `priorityOrder`; undefined for a value that is not a whole number in range or is where the goal
 * already sits, so the dialog has nothing to submit.
 */
export function displacedForPriority(
  priorityOrder: readonly string[],
  goalId: string,
  priority: number
): string | undefined {
  if (!Number.isInteger(priority)) return undefined
  if (priority < 1 || priority > priorityOrder.length) return undefined
  const displaced = priorityOrder[priority - 1]
  return displaced === goalId ? undefined : displaced
}
