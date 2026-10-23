import { holdsGlobalPosition } from "@/entities/goal"

import type { GoalRow } from "./types"

/**
 * The Goals page's one order (spec: `goals-navigation`): goals that hold a position in the global
 * order (Active/Paused) by that position, then every other goal (reached, completed, archived), most
 * recently updated first. There is no other sort.
 */
export function orderRowsByGlobalPriority(rows: readonly GoalRow[]): GoalRow[] {
  return [...rows].sort((left, right) => {
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
