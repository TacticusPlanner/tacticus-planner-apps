import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  editGoal,
  goalOrderConflict,
  goalQueries,
  goalRevisionConflict,
  type EditGoalRequest,
  type GoalDetail,
  type GoalListResponse,
  type GoalOrderResponse,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { goalSlotConflict } from "@/features/goal-planning/@x/goal-create"

/** Why the last Save did not land. Every kind means nothing was saved and the draft is untouched.
 * `stale` carries the goal as it is now; `order` the order as it now stands; `conflict` the existing
 * goal holding the in-flight slot the edit needed. */
export type GoalEditSaveError =
  | { kind: "stale"; current: GoalDetail }
  | { kind: "conflict"; goal: GoalDetail }
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
 * On success the returned goal replaces the cached detail and its summary fields are patched into every
 * cached goal list and project member list, the returned order (when priority was sent) is applied to the
 * cached lists, and only what the response cannot describe is refetched: the project member lists when
 * the projects changed (spec: client-data-freshness). A failure keeps
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
      queryClient.setQueriesData<GoalListResponse>(
        { queryKey: goalQueries.lists() },
        (list) =>
          list && {
            ...list,
            goals: list.goals.map((entry) =>
              entry.goalId === goal.goalId ? goal : entry
            ),
          }
      )
      // Projects changed: the project list's `goalIds` did too.
      if (request.projectIds) {
        void queryClient.invalidateQueries({
          queryKey: projectQueries.list().queryKey,
        })
      }
      // The order is already applied; mark the lists stale for their next mount without refetching now.
      if (order) {
        void queryClient.invalidateQueries({
          queryKey: goalQueries.lists(),
          refetchType: "none",
        })
      }
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
    void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
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

/** Maps a rejected save by its issue code (spec: api-error-handling). */
function classify(reason: unknown): GoalEditSaveError {
  if (!(reason instanceof ApiError)) return { kind: "failed", message: null }
  const stale = goalRevisionConflict(reason)
  if (stale) return { kind: "stale", current: stale.current }
  const order = goalOrderConflict(reason)
  if (order) return { kind: "order", order: order.current }
  const slot = goalSlotConflict(reason)
  if (slot) return { kind: "conflict", goal: slot.current }
  if (reason.status === 400) {
    return {
      kind: "invalid",
      sections: invalidSections(reason.errors),
      message: reason.message,
    }
  }
  return { kind: "failed", message: reason.message }
}

/** The sections a 400 names in its `errors` map (field paths `target.*`, `details.*`, `projectIds`,
 * `priority.*`), first-seen order, deduplicated. */
function invalidSections(
  errors: Record<string, string[]> | undefined
): GoalEditSection[] {
  if (!errors) return []
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
