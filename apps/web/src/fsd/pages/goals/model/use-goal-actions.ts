import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useMsal } from "@azure/msal-react"

import {
  deleteGoal,
  updateGoalStatus,
  useGoalRefresh,
  type GoalStatus,
} from "@/entities/goal"
import { ApiError } from "@/shared/api"

/**
 * Per-goal lifecycle mutations (pause/resume/complete/archive/unarchive/delete) shared by the list, grid,
 * and row-actions menu. Mirrors `guild-purge-dialog.tsx`'s mutate-then-refresh shape, but as a hook (many
 * call sites, one goal each) rather than a single dialog's local state. `pendingId` disables the row whose
 * action is in flight; `onChanged` is the caller's list `retry`.
 */
export function useGoalActions(onChanged: () => void) {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { refreshGoals } = useGoalRefresh()

  const run = async (goalId: string, action: () => Promise<unknown>) => {
    if (!account) {
      return
    }

    setPendingId(goalId)
    try {
      await action()
      refreshGoals()
      onChanged()
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
    if (!account) {
      return
    }

    const ok = await run(goalId, () =>
      updateGoalStatus(instance, account, goalId, status)
    )
    if (ok) {
      toast.success(t("goals.toasts.statusChanged"))
    }
  }

  const remove = async (goalId: string) => {
    if (!account) {
      return false
    }

    const ok = await run(goalId, () => deleteGoal(instance, account, goalId))
    if (ok) {
      toast.success(t("goals.toasts.deleted"))
    }
    return Boolean(ok)
  }

  return { setStatus, remove, pendingId }
}
