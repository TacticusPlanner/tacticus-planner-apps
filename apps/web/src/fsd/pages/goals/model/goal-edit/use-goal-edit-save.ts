import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  editGoal,
  goalOrderConflictDetails,
  goalQueries,
  goalRevisionConflictDetails,
  type EditGoalRequest,
  type GoalDetail,
  type GoalListResponse,
  type GoalOrderResponse,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { projectGoalSlotConflictDetails } from "../projects/project-membership"

/** Why the last Save did not land. Every kind means nothing was saved and the draft is untouched.
 * `stale` carries the goal as it is now; `order` the order as it now stands. */
export type GoalEditSaveError =
  | { kind: "stale"; current: GoalDetail }
  | { kind: "conflict"; projectNames: string[] }
  | { kind: "order"; order: GoalOrderResponse }
  | { kind: "invalid"; sections: GoalEditSection[]; message: string | null }
  | { kind: "failed"; message: string | null }

type GoalEditSection = "target" | "details" | "projects" | "priority"

/** Rewrites the cached goal lists with the order the server just returned, so a follow-up edit (or the
 * dialog's own select) reads the new positions and revision before the refetch lands. */
function applyOrder(
  list: GoalListResponse | undefined,
  order: GoalOrderResponse
): GoalListResponse | undefined {
  if (!list) return list
  const position = new Map(order.goalIds.map((id, index) => [id, index + 1]))
  return {
    ...list,
    orderRevision: order.revision,
    goals: list.goals.map((goal) =>
      position.has(goal.goalId)
        ? { ...goal, globalPriority: position.get(goal.goalId)! }
        : goal
    ),
  }
}

/**
 * The Edit goal dialog's single save: one `editGoal` call for every changed section, all-or-nothing.
 * On success the returned goal replaces the cached detail, the returned order (when priority was sent)
 * is applied to the cached lists, and the goal and project queries are invalidated once. A failure keeps
 * everything as it was and is mapped to a `GoalEditSaveError` for the dialog to show; the draft lives in
 * the caller and is never touched here.
 */
export function useGoalEditSave({
  goalId,
  onSaved,
}: {
  goalId: string
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<GoalEditSaveError | null>(null)
  const mutation = useMutation({
    mutationFn: (request: EditGoalRequest) => editGoal(goalId, request),
  })

  const applyOrderToCache = (order: GoalOrderResponse) =>
    queryClient.setQueriesData<GoalListResponse>(
      { queryKey: goalQueries.lists() },
      (list) => applyOrder(list, order)
    )

  const save = async (request: EditGoalRequest) => {
    setError(null)
    try {
      const { goal, order } = await mutation.mutateAsync(request)
      queryClient.setQueryData(goalQueries.detail(goal.goalId).queryKey, goal)
      if (order) applyOrderToCache(order)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
      onSaved()
    } catch (reason) {
      setError(classify(reason))
    }
  }

  /** Stale revision: adopt the server's current goal (so the next Save uses its revision) and keep the
   * draft. Planning derived from the old goal refetches too. */
  const refreshGoal = (current: GoalDetail) => {
    queryClient.setQueryData(
      goalQueries.detail(current.goalId).queryKey,
      current
    )
    setError(null)
    void queryClient.invalidateQueries({ queryKey: goalQueries.all() })
  }

  /** Stale order: adopt the order as it now stands and keep the draft. */
  const reloadOrder = (order: GoalOrderResponse) => {
    applyOrderToCache(order)
    setError(null)
    void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
  }

  return {
    save,
    isSaving: mutation.isPending,
    error,
    clearError: () => setError(null),
    refreshGoal,
    reloadOrder,
  }
}

function classify(reason: unknown): GoalEditSaveError {
  if (!(reason instanceof ApiError)) return { kind: "failed", message: null }
  const stale = goalRevisionConflictDetails(reason.details)
  if (stale) return { kind: "stale", current: stale.goal }
  const order = goalOrderConflictDetails(reason.details)
  if (order) {
    return {
      kind: "order",
      order: { revision: order.revision, goalIds: order.goalIds },
    }
  }
  const collision = projectGoalSlotConflictDetails(reason.details)
  if (collision) {
    return {
      kind: "conflict",
      projectNames: conflictingProjectNames(
        reason.details,
        collision.projectName
      ),
    }
  }
  if (reason.status === 400) {
    return {
      kind: "invalid",
      sections: invalidSections(reason.details),
      message: reason.message,
    }
  }
  return { kind: "failed", message: reason.message }
}

/** The sections a FastEndpoints 400 names in its `errors` map (keys `Target`, `Details.*`,
 * `ProjectIds`, `Priority`, `Priority.Position`), first-seen order, deduplicated. */
function invalidSections(details: unknown): GoalEditSection[] {
  const errors = (details as { errors?: unknown } | null)?.errors
  if (!errors || typeof errors !== "object") return []
  const sections = Object.keys(errors).flatMap((key): GoalEditSection[] => {
    const root = key.split(/[.[]/)[0]?.toLowerCase()
    return root === "target" || root === "details" || root === "priority"
      ? [root]
      : root === "projectids"
        ? ["projects"]
        : []
  })
  return [...new Set(sections)]
}

/** The names of every project the 409 lists in `conflicts` (see the API's slot-conflict body), falling
 * back to the top-level project when the list is absent. */
function conflictingProjectNames(details: unknown, fallback: string): string[] {
  const conflicts = (details as { conflicts?: unknown } | null)?.conflicts
  const names = Array.isArray(conflicts)
    ? conflicts.flatMap((entry) =>
        typeof (entry as { projectName?: unknown } | null)?.projectName ===
        "string"
          ? [(entry as { projectName: string }).projectName]
          : []
      )
    : []
  return names.length > 0 ? names : [fallback]
}
