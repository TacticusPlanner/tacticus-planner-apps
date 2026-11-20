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
import type { ProjectGoalsPlacement } from "./project-moves"
import { adoptOrder } from "./use-goal-order-actions"
import { runCatching, runWithCleanup } from "@/shared/lib"

/** How long the Undo toast stays (project-goal-moves: "a toast SHALL offer Undo for 10 seconds"). */
const PROJECT_MOVE_UNDO_MS = 10_000

/**
 * Move goals (project-goal-moves): one `PUT goals/order` with the project's in-flight goals placed as
 * a block (to the top, or before or after another project), then a toast announcing the block's new
 * first priority, with Undo. Undo sends the previous order with the
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
    return runWithCleanup(
      async () => {
        return runCatching(
          async () => {
            const order = await updateGoalOrder(previous, revision)
            adoptOrder(queryClient, order)
            toast.success(t("goals.order.projectMove.undone"))
          },
          (error) => {
            const stale = goalOrderConflict(error)
            if (stale) {
              adoptOrder(queryClient, stale.current)
              toast.error(t("goals.order.projectMove.staleUndo"))
            } else {
              toast.error(errorText(error))
            }
          }
        )
      },
      () => {
        settle()
      }
    )
  }

  /** Moves the in-flight goals among `goalIds` as one block to `placement`. Resolves true once the
   *  move is saved; false when it would change nothing. */
  const move = async (
    goalIds: readonly string[],
    placement: ProjectGoalsPlacement = { kind: "top" }
  ): Promise<boolean> => {
    if (!isAuthenticated || pending) return false
    const list =
      queryClient.getQueryData<GoalListResponse>(
        goalQueries.list(false).queryKey
      ) ?? (await queryClient.query(goalQueries.list(false)))
    const previous = inFlightInGlobalOrder(list.goals).map(
      (goal) => goal.goalId
    )
    const next = moveProjectGoals(previous, goalIds, placement)
    const changed = next.some((id, i) => id !== previous[i])
    const reference = new Set(
      placement.kind === "top" ? [] : placement.referenceIds
    )
    const members = new Set(goalIds)
    const moved = next.filter(
      (goalId) => members.has(goalId) && !reference.has(goalId)
    )
    const first = moved[0]
    if (first === undefined || !changed) return false
    const priority = next.indexOf(first) + 1

    setPending(true)
    return runWithCleanup(
      async () => {
        return runCatching(
          async () => {
            const order = await updateGoalOrder(next, list.orderRevision)
            adoptOrder(queryClient, order)
            toast.success(
              t("goals.order.projectMove.moved", {
                count: moved.length,
                priority,
              }),
              {
                duration: PROJECT_MOVE_UNDO_MS,
                action: {
                  label: t("goals.order.projectMove.undo"),
                  onClick: () => void undo(previous, order.revision),
                },
              }
            )
            return true
          },
          (error) => {
            const stale = goalOrderConflict(error)
            if (stale) adoptOrder(queryClient, stale.current)
            toast.error(
              stale ? t("goals.order.projectMove.staleMove") : errorText(error)
            )
            return false
          }
        )
      },
      () => {
        setPending(false)
        settle()
      }
    )
  }

  /** Move goals to top, kept for callers that only offer the top. */
  const moveToTop = (goalIds: readonly string[]) =>
    move(goalIds, { kind: "top" })

  return { move, moveToTop, pending }
}
