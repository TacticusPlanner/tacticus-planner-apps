import { apiIssue } from "@/shared/api"

import type { GoalOrderResponse } from "./types"

/** Only an Active/Paused goal holds a position in the account-wide order. */
export const holdsGlobalPosition = (goal: { status: string }) =>
  goal.status === "Active" || goal.status === "Paused"

/** In-flight (Active/Paused) goals in canonical global order — the one deduplicated sequence every
 * planning surface and the Goals page share. A goal without a position (never expected for an
 * in-flight one) sorts last, stably, rather than being dropped. */
export function inFlightInGlobalOrder<
  T extends { status: string; globalPriority: number | null },
>(goals: readonly T[]): T[] {
  return goals
    .filter(holdsGlobalPosition)
    .map((goal, index) => ({ goal, index }))
    .sort(
      (left, right) =>
        (left.goal.globalPriority ?? Number.MAX_SAFE_INTEGER) -
          (right.goal.globalPriority ?? Number.MAX_SAFE_INTEGER) ||
        left.index - right.index
    )
    .map(({ goal }) => goal)
}

/**
 * The array move the API performs for a reorder: `movedId` is removed and re-inserted at the index
 * `displacedId` occupies, so everything between them shifts one place toward the vacated slot. With
 * A,B,C,D,E moving E onto C gives A,B,E,C,D, and moving C onto E gives A,B,D,E,C. Null when either
 * id is absent or they are the same goal.
 */
export function moveOntoDisplaced(
  orderedIds: readonly string[],
  movedId: string,
  displacedId: string
): string[] | null {
  const from = orderedIds.indexOf(movedId)
  const to = orderedIds.indexOf(displacedId)
  if (from < 0 || to < 0 || from === to) return null
  const moved = [...orderedIds]
  moved.splice(from, 1)
  moved.splice(to, 0, movedId)
  return moved
}

/**
 * The same move applied to goals' *absolute* global positions, so it also works on a partial list (a
 * project's projection, whose members' positions are not contiguous): the moved goal takes the
 * displaced goal's position and every goal whose position lies between shifts one place toward the
 * vacated one. `positions` are the two goals' positions when the caller knows them from a wider view: a
 * project holding only one of the pair still needs the move applied to its members. Returns the input
 * untouched when a position is unknown.
 */
export function applyPositionMove<
  T extends { goalId: string; globalPriority: number | null },
>(
  goals: readonly T[],
  movedId: string,
  displacedId: string,
  positions?: { from: number; to: number }
): T[] {
  const from =
    positions?.from ??
    goals.find((goal) => goal.goalId === movedId)?.globalPriority
  const to =
    positions?.to ??
    goals.find((goal) => goal.goalId === displacedId)?.globalPriority
  if (from == null || to == null || from === to) return [...goals]

  return goals.map((goal) => {
    const position = goal.globalPriority
    if (position == null) return goal
    if (goal.goalId === movedId) return { ...goal, globalPriority: to }
    if (from > to && position >= to && position < from) {
      return { ...goal, globalPriority: position + 1 }
    }
    if (from < to && position > from && position <= to) {
      return { ...goal, globalPriority: position - 1 }
    }
    return goal
  })
}

/** The order as it now stands when `error` is a reorder/move 409 (`goalOrderStale`,
 * `goalOrderSetMismatch`), so the client can adopt it without a read; null for any other error. */
export function goalOrderConflict(error: unknown): {
  issueCode: "goalOrderStale" | "goalOrderSetMismatch"
  current: GoalOrderResponse
} | null {
  const issue = apiIssue(error, "goalOrderStale", "goalOrderSetMismatch")
  const current = issue?.current as Partial<GoalOrderResponse> | undefined
  return issue &&
    typeof current?.revision === "number" &&
    Array.isArray(current.goalIds)
    ? {
        issueCode: issue.issueCode as "goalOrderStale" | "goalOrderSetMismatch",
        current: current as GoalOrderResponse,
      }
    : null
}
