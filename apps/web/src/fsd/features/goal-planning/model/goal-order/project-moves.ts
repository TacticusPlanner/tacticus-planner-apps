/** Where a project's goals go in the account-wide order (project-goal-moves): to the top, or just
 * before the first / just after the last remaining goal of a reference project. */
export type ProjectGoalsPlacement =
  | { kind: "top" }
  | { kind: "before" | "after"; referenceIds: readonly string[] }

/**
 * The in-flight order after moving `movedIds` as one block: the moved goals keep their relative order
 * and every other goal keeps its relative order. Ids in `movedIds` that are not in `order` are
 * ignored. With A, B, C, D, E, F (B and D in GW S29, C and E in Chaos Core):
 * - to the top gives C, E, A, B, D, F;
 * - before GW S29 gives A, C, E, B, D, F (B is GW S29's first goal);
 * - after GW S29 gives A, B, D, C, E, F (D is its last).
 * A goal also in the reference project stays where it is. With no reference goal left in the order,
 * nothing moves.
 */
export function moveProjectGoals(
  order: readonly string[],
  movedIds: Iterable<string>,
  placement: ProjectGoalsPlacement
): string[] {
  const reference = new Set(
    placement.kind === "top" ? [] : placement.referenceIds
  )
  const moved = new Set([...movedIds].filter((id) => !reference.has(id)))
  const block = order.filter((goalId) => moved.has(goalId))
  const rest = order.filter((goalId) => !moved.has(goalId))
  switch (placement.kind) {
    case "top": {
      return [...block, ...rest]
    }
    case "before":
    case "after": {
      const first = rest.findIndex((goalId) => reference.has(goalId))
      if (first === -1 || block.length === 0) return [...order]
      const last = rest.findLastIndex((goalId) => reference.has(goalId))
      const at = placement.kind === "before" ? first : last + 1
      return [...rest.slice(0, at), ...block, ...rest.slice(at)]
    }
  }
}

/**
 * The projects Before and After can place against (project-goal-moves): non-archived projects other
 * than the moved one that hold at least one in-flight goal not also in the moved project, by name.
 */
export function projectMoveReferences<
  P extends { projectId: string; name: string; status: string },
>(
  projects: readonly P[],
  movedProjectId: string,
  goals: readonly {
    goalId: string
    status: string
    projectIds: readonly string[]
  }[]
): P[] {
  const inFlight = goals.filter(
    (goal) => goal.status === "Active" || goal.status === "Paused"
  )
  return projects
    .filter(
      (project) =>
        project.projectId !== movedProjectId &&
        project.status !== "Archived" &&
        inFlight.some(
          (goal) =>
            goal.projectIds.includes(project.projectId) &&
            !goal.projectIds.includes(movedProjectId)
        )
    )
    .toSorted((left, right) => left.name.localeCompare(right.name))
}

/** Whether a project's in-flight goals already hold the first positions, so To the top would
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

/** Ids of a project's in-flight (Active and Paused) goals: what Move goals moves. */
export function projectInFlightGoalIds(
  goals: readonly { goalId: string; status: string }[]
): string[] {
  return goals
    .filter((goal) => goal.status === "Active" || goal.status === "Paused")
    .map((goal) => goal.goalId)
}
