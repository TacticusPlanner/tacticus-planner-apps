import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  goalQueries,
  goalRevisionConflictDetails,
  updateGoalTarget,
  type GoalDetail,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { projectGoalSlotConflictDetails } from "../projects/project-membership"
import {
  goalTargetEditFromDraft,
  type GoalTargetDraft,
} from "./goal-target-edit"

/** Why the last Save target did not land. `stale` and `collision` both keep the owner's draft in the
 * editor; `stale` carries the goal as it is now so the owner can load it and review. */
export type GoalTargetSaveError =
  | { kind: "stale"; current: GoalDetail }
  | {
      kind: "collision"
      projectName: string
      existingGoalId: string
      message: string
    }
  | { kind: "failed"; message: string | null }

/** After a successful edit the goal/project queries (which every need, estimate, blocker, Dailies and
 * Insights calculation derives from) are refetched. `failed` means the save landed but a refetch did
 * not — the numbers on screen may still describe the old target and must not be read as current. */
export type PlanningRefreshState = "idle" | "refreshing" | "failed"

/**
 * Saves a goal's target through the dedicated, revision-checked endpoint — separate from the detail
 * sheet's general save, so it neither submits nor discards the notes/strategy/project draft. The edit
 * uses the revision of the goal detail it was opened from (`detail.revision`); a stale revision or a
 * Rank milestone collision is surfaced as a typed error rather than retried, so nothing overwrites a
 * newer edit.
 */
export function useGoalTargetSave({
  detail,
  onSaved,
}: {
  detail: GoalDetail
  onSaved: (updated: GoalDetail) => void
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<GoalTargetSaveError | null>(null)
  const [refreshState, setRefreshState] = useState<PlanningRefreshState>("idle")

  const refreshPlanning = async () => {
    setRefreshState("refreshing")
    try {
      await Promise.all([
        queryClient.invalidateQueries(
          { queryKey: goalQueries.all() },
          { throwOnError: true }
        ),
        queryClient.invalidateQueries(
          { queryKey: projectQueries.all() },
          { throwOnError: true }
        ),
      ])
      setRefreshState("idle")
    } catch {
      setRefreshState("failed")
    }
  }

  const mutation = useMutation({
    mutationFn: (draft: GoalTargetDraft) =>
      updateGoalTarget(detail.goalId, {
        expectedRevision: detail.revision,
        target: goalTargetEditFromDraft(draft),
      }),
  })

  /** Resolves true when the target was saved (the planning refresh may still be running or failed —
   * see `refreshState`). */
  const save = async (draft: GoalTargetDraft): Promise<boolean> => {
    setError(null)
    try {
      const updated = await mutation.mutateAsync(draft)
      queryClient.setQueryData(
        goalQueries.detail(updated.goalId).queryKey,
        updated
      )
      onSaved(updated)
      void refreshPlanning()
      return true
    } catch (reason) {
      setError(classify(reason))
      return false
    }
  }

  /** Replaces the cached goal with the server's current version (from a stale-revision conflict) so the
   * next Save target uses its revision. The editor's draft is left alone for the owner to review. */
  const loadCurrent = (current: GoalDetail) => {
    queryClient.setQueryData(
      goalQueries.detail(current.goalId).queryKey,
      current
    )
    void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
    setError(null)
  }

  return {
    save,
    isSaving: mutation.isPending,
    error,
    clearError: () => setError(null),
    loadCurrent,
    refreshState,
    retryRefresh: () => void refreshPlanning(),
  }
}

function classify(reason: unknown): GoalTargetSaveError {
  if (!(reason instanceof ApiError)) return { kind: "failed", message: null }
  const stale = goalRevisionConflictDetails(reason.details)
  if (stale) return { kind: "stale", current: stale.goal }
  const collision = projectGoalSlotConflictDetails(reason.details)
  if (collision) {
    return {
      kind: "collision",
      projectName: collision.projectName,
      existingGoalId: collision.existingGoalId,
      message: collision.message,
    }
  }
  return { kind: "failed", message: reason.message }
}
