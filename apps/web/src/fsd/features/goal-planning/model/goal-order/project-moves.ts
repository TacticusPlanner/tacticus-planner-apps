/** Where a project's goals go in the account-wide order. Only `top` exists for now;
 * `add-move-project-goals-relative` adds `before` and `after` a project. */
export type ProjectGoalsPlacement = { kind: "top" }

/**
 * The in-flight order after moving `movedIds` as one block (add-move-project-goals): the moved goals
 * keep their relative order and go first, and every other goal keeps its relative order. Ids in
 * `movedIds` that are not in `order` are ignored. With A, B, C, D, E, F moving C and E to the top
 * gives C, E, A, B, D, F.
 */
export function moveProjectGoals(
  order: readonly string[],
  movedIds: Iterable<string>,
  placement: ProjectGoalsPlacement
): string[] {
  const moved = new Set(movedIds)
  const block = order.filter((goalId) => moved.has(goalId))
  const rest = order.filter((goalId) => !moved.has(goalId))
  switch (placement.kind) {
    case "top": {
      return [...block, ...rest]
    }
  }
}

/** Whether a project's in-flight goals already hold the first positions, so Move goals to top would
 * change nothing. Reads each goal's `globalPriority` (1-based), so it needs no full order. */
export function projectGoalsAlreadyFirst(
  goals: readonly { status: string; globalPriority: number | null }[]
): boolean {
  const positions = goals
    .filter((goal) => goal.status === "Active" || goal.status === "Paused")
    .map((goal) => goal.globalPriority)
  if (positions.length === 0) return true
  if (positions.some((position) => position === null)) return false
  const sorted = (positions as number[]).toSorted((left, right) => left - right)
  return sorted.every((position, index) => position === index + 1)
}

/** Ids of a project's in-flight (Active and Paused) goals: what Move goals to top moves. */
export function projectInFlightGoalIds(
  goals: readonly { goalId: string; status: string }[]
): string[] {
  return goals
    .filter((goal) => goal.status === "Active" || goal.status === "Paused")
    .map((goal) => goal.goalId)
}
