import type { GoalDetail, GoalStatus } from "@/entities/goal"

type WithStatus = { status: GoalStatus }

/** Summary fields a server response writes into every cached copy of a goal; omitted keys stay. */
export type GoalFieldPatch = Partial<
  Pick<
    GoalDetail,
    "status" | "globalPriority" | "notes" | "dependsOn" | "updatedAt"
  >
>

/**
 * Patches `goalId`'s status in place within one cached query's data, handling every shape
 * `useGoalActions` needs to keep optimistically in sync: a single cached `GoalDetail`
 * (`goalQueries.detail`) and the flat `{ goals: GoalDetail[] }` list (`goalQueries.list`).
 * Returns the same reference when nothing changes, so an unrelated cache entry doesn't re-render.
 *
 * Scoped to the Active/Paused pause-resume toggle only (see `use-goal-actions.ts`) — neither shape
 * needs an entry to move between different cached arrays for that transition, unlike archiving
 * (Overview caches Archived and non-Archived goals as two separate queries) or completing, so a
 * plain in-place field patch is correct here in a way it wouldn't be for every status transition.
 * After the server answers, the response's summary fields are written the same way for any change;
 * a change that moves entries between lists then refetches those lists.
 */
export function applyOptimisticGoalStatus(
  data: unknown,
  goalId: string,
  status: GoalStatus | GoalFieldPatch
): unknown {
  if (typeof data !== "object" || data === null) return data
  const patch = Object.fromEntries(
    // A patch built at runtime can carry explicit `undefined` fields; those are not changes.
    Object.entries<unknown>(
      typeof status === "string" ? { status } : status
    ).filter(([, value]) => value !== undefined)
  )
  const apply = <T extends WithStatus>(goal: T): T =>
    Object.entries(patch).every(
      ([key, value]) => (goal as Record<string, unknown>)[key] === value
    )
      ? goal
      : { ...goal, ...patch }

  if ("goalId" in data && data.goalId === goalId) {
    return apply(data as { goalId: string } & WithStatus)
  }

  if ("goals" in data && Array.isArray(data.goals)) {
    const goals = (data as { goals: unknown[] }).goals
    const nextGoals = goals.map((entry) => {
      if (typeof entry !== "object" || entry === null) return entry
      const flat = entry as { goalId: string } & WithStatus
      return flat.goalId === goalId ? apply(flat) : entry
    })
    const changed = nextGoals.some((goal, index) => goal !== goals[index])
    return changed ? { ...data, goals: nextGoals } : data
  }

  return data
}
