import { holdsGlobalPosition } from "@/entities/goal"

/** The goal each row-menu move would displace (`GoalOrderMove.displacedGoalId`); a direction with
 *  no target is not offered. */
export type GoalMenuMoves = {
  top?: string
  up?: string
  down?: string
}

/**
 * Row-menu priority moves (Move to top / up / down) for the visible rows, keyed by goal id. A move
 * steps over the neighbouring in-flight goal in priority order among the rows the filters show,
 * ignoring Group, so a move can cross a group boundary that a drag cannot. Hidden goals keep their
 * relative order, exactly as for a drop. Move to top is left out where it would equal Move up.
 */
export function goalMenuMoves(
  visibleRows: readonly { goalId: string; status: string }[]
): Map<string, GoalMenuMoves> {
  const ids = visibleRows.filter(holdsGlobalPosition).map((row) => row.goalId)
  const moves = new Map<string, GoalMenuMoves>()
  if (ids.length < 2) return moves
  ids.forEach((goalId, index) => {
    moves.set(goalId, {
      top: index > 1 ? ids[0] : undefined,
      up: index > 0 ? ids[index - 1] : undefined,
      down: index < ids.length - 1 ? ids[index + 1] : undefined,
    })
  })
  return moves
}
