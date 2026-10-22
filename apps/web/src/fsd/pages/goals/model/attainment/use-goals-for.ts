import { useGoalsById } from "@/entities/goal"

/**
 * The goals list by id, plus the archived list only when one of `goalIds` is not a non-archived goal
 * (the Goals page's archived filter): every goal read comes from a list, never a per-goal detail.
 */
export function useGoalsFor(goalIds: readonly string[]) {
  const active = useGoalsById()
  const needsArchived =
    !active.loading && goalIds.some((goalId) => !active.goalsById.has(goalId))
  return useGoalsById({ includeArchived: needsArchived })
}
