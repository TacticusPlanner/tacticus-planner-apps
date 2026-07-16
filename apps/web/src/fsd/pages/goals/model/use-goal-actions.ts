import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  deleteGoal,
  goalQueries,
  updateGoalStatus,
  type GoalStatus,
} from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useActiveAccountId } from "@/shared/auth"

/**
 * Per-goal lifecycle mutations (pause/resume/complete/archive/unarchive/delete) shared by the list, grid,
 * and row-actions menu. Mirrors `guild-purge-dialog.tsx`'s mutate-then-refresh shape, but as a hook (many
 * call sites, one goal each) rather than a single dialog's local state. `pendingId` disables the row whose
 * action is in flight; `onChanged` is the caller's list `retry`.
 */
export function useGoalActions(_onChanged?: () => void) {
  void _onChanged
  const { t } = useTranslation()
  const accountId = useActiveAccountId()
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: ({
      action,
    }: {
      action: () => Promise<unknown>
      accountId: string
    }) => action(),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: goalQueries.all(variables.accountId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectQueries.all(variables.accountId),
        }),
      ])
    },
  })

  const run = async (goalId: string, action: () => Promise<unknown>) => {
    if (!accountId) {
      return
    }

    setPendingId(goalId)
    try {
      await mutation.mutateAsync({ action, accountId })
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
    if (!accountId) {
      return
    }

    const ok = await run(goalId, () => updateGoalStatus(goalId, status))
    if (ok) {
      toast.success(t("goals.toasts.statusChanged"))
    }
  }

  const remove = async (goalId: string) => {
    if (!accountId) {
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
