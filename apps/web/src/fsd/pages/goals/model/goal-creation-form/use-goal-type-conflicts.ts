import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  goalQueries,
  type GoalEntityType,
  type GoalKind,
  type GoalSummary,
} from "@/entities/goal"

/**
 * Which goal kinds already have an Active or Paused goal for `entityId` — the pure half of
 * `useGoalTypeConflicts` below, split out so it's directly unit-testable without mounting react-query
 * (mirrors this codebase's calc/hook split, e.g. estimate.ts vs. its callers). A unit may still
 * accumulate any number of Completed/Archived goals of the same type, so only Active/Paused count.
 */
export function conflictingGoalKinds(
  goals: readonly GoalSummary[],
  entityId: string | undefined,
  entityType: GoalEntityType
): ReadonlySet<GoalKind> {
  const kinds = new Set<GoalKind>()
  if (!entityId) return kinds
  for (const goal of goals) {
    if (
      goal.entityId === entityId &&
      goal.entityType === entityType &&
      (goal.status === "Active" || goal.status === "Paused")
    ) {
      kinds.add(goal.goalType)
    }
  }
  return kinds
}

/**
 * Which of the selected entity's goal kinds already have an Active or Paused goal — the client-side
 * mirror of the backend's "at most one Active/Paused goal per (entity, goal type)" invariant
 * (CreateGoalEndpoint/CreateCombinedGoalsEndpoint/UpdateGoalStatusEndpoint). Used to disable that
 * kind's toggle in the Create Goal drawer before the user hits the server-side 400. Reuses the same
 * non-archived goals list `use-goals.ts`/`goals-page.tsx` already fetch, rather than a second endpoint
 * — `goalQueries.list(false)` only excludes Archived, so Completed goals are filtered out by
 * `conflictingGoalKinds` too.
 */
export function useGoalTypeConflicts({
  entityId,
  entityType,
  enabled,
}: {
  entityId: string | undefined
  entityType: GoalEntityType
  enabled: boolean
}) {
  const query = useQuery({
    ...goalQueries.list(false),
    enabled,
  })

  const kinds = useMemo(
    () => conflictingGoalKinds(query.data?.goals ?? [], entityId, entityType),
    [query.data, entityId, entityType]
  )

  return {
    hasActiveOrPausedGoal: (kind: GoalKind) => kinds.has(kind),
  }
}
