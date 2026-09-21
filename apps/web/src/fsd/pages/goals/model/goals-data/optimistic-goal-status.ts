import type { GoalStatus } from "@/entities/goal"

type WithStatus = { status: GoalStatus }

/**
 * Patches `goalId`'s status in place within one cached query's data, handling every shape
 * `useGoalActions` needs to keep optimistically in sync: a single cached `GoalDetail`
 * (`goalQueries.detail`), the flat `{ goals: GoalSummary[] }` list (`goalQueries.list`), and the
 * project-membership-wrapped `{ goals: ProjectGoalSummary[] }` list (`projectQueries.goals`).
 * Returns the same reference when nothing changes, so an unrelated cache entry doesn't re-render.
 *
 * Scoped to the Active/Paused pause-resume toggle only (see `use-goal-actions.ts`) — neither shape
 * needs an entry to move between different cached arrays for that transition, unlike archiving
 * (Overview caches Archived and non-Archived goals as two separate queries) or completing, so a
 * plain in-place field patch is correct here in a way it wouldn't be for every status transition.
 */
export function applyOptimisticGoalStatus(
  data: unknown,
  goalId: string,
  status: GoalStatus
): unknown {
  if (!data || typeof data !== "object") return data

  if ("goalId" in data && (data as { goalId: unknown }).goalId === goalId) {
    const current = data as { goalId: string } & WithStatus
    return current.status === status ? data : { ...current, status }
  }

  if ("goals" in data && Array.isArray((data as { goals: unknown }).goals)) {
    const goals = (data as { goals: unknown[] }).goals
    let changed = false
    const nextGoals = goals.map((entry) => {
      if (!entry || typeof entry !== "object") return entry
      if ("goal" in entry) {
        const inner = (entry as { goal: { goalId: string } & WithStatus }).goal
        if (inner.goalId !== goalId || inner.status === status) return entry
        changed = true
        return { ...entry, goal: { ...inner, status } }
      }
      const flat = entry as { goalId: string } & WithStatus
      if (flat.goalId !== goalId || flat.status === status) return entry
      changed = true
      return { ...flat, status }
    })
    return changed ? { ...data, goals: nextGoals } : data
  }

  return data
}
