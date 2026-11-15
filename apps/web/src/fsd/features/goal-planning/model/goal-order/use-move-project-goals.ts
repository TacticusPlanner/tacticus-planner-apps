import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  goalOrderConflict,
  goalQueries,
  inFlightInGlobalOrder,
  updateGoalOrder,
} from "@/entities/goal"
import type { GoalListResponse } from "@/entities/goal"
import { ApiError } from "@/shared/api"

import { moveProjectGoals } from "./project-moves"
import { adoptOrder } from "./use-goal-order-actions"

/** How long the Undo toast stays (project-goal-moves: "a toast SHALL offer Undo for 10 seconds"). */
const PROJECT_MOVE_UNDO_MS = 10_000

/**
 * Move goals to top (add-move-project-goals): one `PUT goals/order` with the project's in-flight goals
 * first as a block, then an announcing toast with Undo. Undo sends the previous order with the
 * revision the move returned, so it lands only when nothing changed the order since; otherwise the
 * server rejects it as stale, the order as it stands is adopted, and nothing is undone.
 */
export function useMoveProjectGoals() {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  const errorText = (error: unknown) =>
    error instanceof ApiError && error.message
      ? error.message
      : t("goals.toasts.actionError")

  const settle = () =>
    void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })

  const undo = async (previous: string[], revision: number) => {
    try {
      const order = await updateGoalOrder(previous, revision)
      adoptOrder(queryClient, order)
      toast.success(t("goals.order.projectMove.undone"))
    } catch (error) {
      const stale = goalOrderConflict(error)
      if (stale) {
        adoptOrder(queryClient, stale.current)
        toast.error(t("goals.order.projectMove.staleUndo"))
      } else {
        toast.error(errorText(error))
      }
    } finally {
      settle()
    }
  }

  /** Moves the in-flight goals among `goalIds` to the top. Resolves true once the move is saved. */
  const moveToTop = async (goalIds: readonly string[]): Promise<boolean> => {
    if (!isAuthenticated || pending) return false
    const list =
      queryClient.getQueryData<GoalListResponse>(
        goalQueries.list(false).queryKey
      ) ?? (await queryClient.query(goalQueries.list(false)))
    const previous = inFlightInGlobalOrder(list.goals).map(
      (goal) => goal.goalId
    )
    const members = new Set(goalIds)
    const moved = previous.filter((goalId) => members.has(goalId))
    const next = moveProjectGoals(previous, moved, { kind: "top" })
    if (moved.length === 0 || next.every((id, i) => id === previous[i])) {
      return false
    }

    setPending(true)
    try {
      const order = await updateGoalOrder(next, list.orderRevision)
      adoptOrder(queryClient, order)
      toast.success(
        t("goals.order.projectMove.moved", { count: moved.length }),
        {
          duration: PROJECT_MOVE_UNDO_MS,
          action: {
            label: t("goals.order.projectMove.undo"),
            onClick: () => void undo(previous, order.revision),
          },
        }
      )
      return true
    } catch (error) {
      const stale = goalOrderConflict(error)
      if (stale) adoptOrder(queryClient, stale.current)
      toast.error(
        stale ? t("goals.order.projectMove.staleMove") : errorText(error)
      )
      return false
    } finally {
      setPending(false)
      settle()
    }
  }

  return { moveToTop, pending }
}
