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
 * call sites, one goal each) rather than a single dialog's local state. `pendingId` disables the row whose
 * action is in flight; `onChanged` is the caller's list `retry`.
 */
export function useGoalActions(_onChanged?: () => void) {
  void _onChanged
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
    },
  })

  const run = async (goalId: string, action: () => Promise<unknown>) => {
    if (!isAuthenticated) {
      return
    }

    setPendingId(goalId)
    try {
      await mutation.mutateAsync(action)
      return true
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : t("goals.toasts.actionError")
      )
      return false
    } finally {
      setPendingId(null)
    }
  }

  const setStatus = async (goalId: string, status: GoalStatus) => {
    if (!isAuthenticated) {
      return
    }

    const ok = await run(goalId, () => updateGoalStatus(goalId, status))
    if (ok) {
      toast.success(t("goals.toasts.statusChanged"))
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

  return { setStatus, remove, pendingId }
}
