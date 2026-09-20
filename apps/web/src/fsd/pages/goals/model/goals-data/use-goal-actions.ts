import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  deleteGoal,
  goalQueries,
  updateGoalStatus,
  type GoalStatus,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"

/**
 * Per-goal lifecycle mutations (pause/resume/complete/archive/unarchive/delete) shared by the list, grid,
 * and row-actions menu. Mirrors `guild-purge-dialog.tsx`'s mutate-then-refresh shape, but as a hook (many
 * call sites, one goal each) rather than a single dialog's local state. `pendingIds` disables every row
 * whose action is currently in flight — a set, not a single id, since a prerequisite cascade (see
 * `setStatus`'s `cascadeIds`) can have several goals in flight from one user action at once; `onChanged`
 * is the caller's list `retry`.
 */
export function useGoalActions(_onChanged?: () => void) {
  void _onChanged
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
    },
  })

  const addPending = (goalId: string) =>
    setPendingIds((prev) => new Set(prev).add(goalId))
  const removePending = (goalId: string) =>
    setPendingIds((prev) => {
      if (!prev.has(goalId)) return prev
      const next = new Set(prev)
      next.delete(goalId)
      return next
    })

  /** `silent` skips the per-call error toast — used for a cascade target beyond the acting goal
   *  itself, so a partial cascade failure surfaces as one aggregate toast (see `setStatus`) rather
   *  than one toast per failed prerequisite. `trackPending: false` skips this call's own add/remove
   *  because the caller is already holding `goalId` pending for a longer span (see `setStatus`) —
   *  without it, a cascade's acting goal would re-enable its row between its own call finishing and
   *  the last prerequisite call finishing, letting a second click start an overlapping cascade. */
  const run = async (
    goalId: string,
    action: () => Promise<unknown>,
    options: { silent?: boolean; trackPending?: boolean } = {}
  ) => {
    if (!isAuthenticated) {
      return false
    }

    const trackPending = options.trackPending ?? true
    if (trackPending) addPending(goalId)
    try {
      await mutation.mutateAsync(action)
      return true
    } catch (error) {
      if (!options.silent) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : t("goals.toasts.actionError")
        )
      }
      return false
    } finally {
      if (trackPending) removePending(goalId)
    }
  }

  /**
   * `cascadeIds` are prerequisite goals (from `dependsOn`) to transition to the same `status`
   * alongside `goalId`, sequentially, after the acting goal's own call succeeds (see design.md: not
   * `Promise.all`, since each call also renormalizes its project's priority order server-side).
   * Callers are responsible for excluding a `Completed`/`Archived` prerequisite from `cascadeIds`
   * before calling this — this function does not re-check a target's current status. Every goal
   * involved (the acting goal and every cascade target) stays pending for the whole operation, not
   * just its own individual call, so none of their rows can be clicked again — starting a second,
   * overlapping cascade — before the first one finishes.
   */
  const setStatus = async (
    goalId: string,
    status: GoalStatus,
    cascadeIds: readonly string[] = []
  ) => {
    if (!isAuthenticated) {
      return
    }

    const allIds = [goalId, ...cascadeIds]
    allIds.forEach(addPending)
    try {
      const ok = await run(goalId, () => updateGoalStatus(goalId, status), {
        trackPending: false,
      })
      if (!ok) {
        return
      }
      if (cascadeIds.length === 0) {
        toast.success(t("goals.toasts.statusChanged"))
        return
      }

      let cascadeSucceeded = 0
      for (const id of cascadeIds) {
        const cascadeOk = await run(id, () => updateGoalStatus(id, status), {
          silent: true,
          trackPending: false,
        })
        if (cascadeOk) cascadeSucceeded++
      }
      const total = cascadeIds.length + 1
      if (cascadeSucceeded === cascadeIds.length) {
        toast.success(t("goals.toasts.statusChanged"))
      } else {
        toast.error(
          t("goals.toasts.statusChangedPartial", {
            succeeded: cascadeSucceeded + 1,
            total,
          })
        )
      }
    } finally {
      allIds.forEach(removePending)
    }
  }

  const remove = async (goalId: string) => {
    if (!isAuthenticated) {
      return false
    }

    const ok = await run(goalId, () => deleteGoal(goalId))
    if (ok) {
      toast.success(t("goals.toasts.deleted"))
    }
    return Boolean(ok)
  }

  return { setStatus, remove, pendingIds }
}
