import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  applyPositionMove,
  goalOrderConflict,
  goalQueries,
  inFlightInGlobalOrder,
  moveOntoDisplaced,
  updateGoalOrder,
  type GoalListResponse,
  type GoalOrderResponse,
} from "@/entities/goal"
import { moveProjectGoal } from "@/entities/project"
import { ApiError } from "@/shared/api"

/** One reorder gesture: `goalId` takes the global position `displacedGoalId` holds. With a
 * `projectId` it was made on that project's projection (any hidden goals in between keep their
 * relative order); without one it was made on the Goals page over the complete order. */
export type GoalOrderMove = {
  goalId: string
  displacedGoalId: string
  projectId?: string
}

/** A move the server rejected because the order changed under the user. The attempted move is kept so
 * the user can review the refreshed order and retry it explicitly; it is never replayed silently. */
export type GoalOrderConflict = { move: GoalOrderMove; message: string }

type Snapshot = { queryKey: readonly unknown[]; data: unknown }

/** Rewrites every cached goal list the way the server will persist the move, so every view (they all
 * read the goals list; a project's view is a filter of it) agrees before the round trip completes.
 * Returns the previous data so a failure can roll back. */
function applyOptimisticMove(
  queryClient: QueryClient,
  move: GoalOrderMove
): Snapshot[] {
  const snapshots: Snapshot[] = []
  // Where the two goals sit in the account-wide order: a project that holds only one of the pair (or
  // neither) still has its members shifted correctly.
  const positionOf = (goalId: string) => {
    for (const [, data] of queryClient.getQueriesData<GoalListResponse>({
      queryKey: goalQueries.lists(),
    })) {
      const found = data?.goals.find((goal) => goal.goalId === goalId)
      if (found?.globalPriority != null) return found.globalPriority
    }
    return null
  }
  const from = positionOf(move.goalId)
  const to = positionOf(move.displacedGoalId)
  const positions = from !== null && to !== null ? { from, to } : undefined

  for (const [queryKey, data] of queryClient.getQueriesData<GoalListResponse>({
    queryKey: goalQueries.lists(),
  })) {
    if (!data) continue
    snapshots.push({ queryKey, data })
    const moved = applyPositionMove(
      data.goals,
      move.goalId,
      move.displacedGoalId,
      positions
    )
    queryClient.setQueryData<GoalListResponse>(queryKey, {
      ...data,
      goals: [
        ...inFlightInGlobalOrder(moved),
        ...moved.filter((goal) => goal.globalPriority === null),
      ],
      orderRevision: data.orderRevision + 1,
    })
  }

  return snapshots
}

/** Adopts the order a 409 reports as current into every cached goal list (spec: api-error-handling:
 * a conflict's current state is adopted at once). */
function adoptOrder(queryClient: QueryClient, order: GoalOrderResponse) {
  const position = new Map(order.goalIds.map((id, index) => [id, index + 1]))
  queryClient.setQueriesData<GoalListResponse>(
    { queryKey: goalQueries.lists() },
    (list) => {
      if (!list) return list
      const goals = list.goals.map((goal) =>
        position.has(goal.goalId)
          ? { ...goal, globalPriority: position.get(goal.goalId)! }
          : goal
      )
      return {
        ...list,
        orderRevision: order.revision,
        goals: [
          ...inFlightInGlobalOrder(goals),
          ...goals.filter((goal) => goal.globalPriority === null),
        ],
      }
    }
  )
}

/** The freshest cached order, if any — the goals list, for a project move too. Read synchronously so a
 * gesture reads and applies its optimistic write with nothing in between: a second gesture then always
 * starts from the first one's result. */
function cachedOrder(queryClient: QueryClient) {
  return queryClient.getQueryData<GoalListResponse>(
    goalQueries.list(false).queryKey
  )
}

/**
 * Reorder gestures on the account-wide goal order, from either the Goals page or a project's
 * projection (`goal-order` feature). A move is applied to every cached view immediately, then sent —
 * one request at a time, in gesture order, because each echoes the revision the previous one advanced.
 * A rejected move is rolled back; if the order changed under the user (409 `goalOrder*`) the attempted
 * move is kept in `conflict` while the caches refresh, and `retry` re-applies it only when the user
 * asks.
 */
export function useGoalOrderActions() {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState(0)
  const [conflict, setConflict] = useState<GoalOrderConflict | null>(null)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  // Gestures accepted but not yet settled. Caches are only refetched once the last one settles: an
  // earlier response's refetch would otherwise overwrite a later gesture's optimistic state.
  const outstanding = useRef(0)

  // The order lives in the goal lists, so only those refetch; a goal's detail is unaffected by a move
  // and is only marked stale rather than refetched per drop.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: goalQueries.lists() }),
      queryClient.invalidateQueries({
        queryKey: goalQueries.details(),
        refetchType: "none",
      }),
    ])

  const send = async (
    move: GoalOrderMove,
    revision: number,
    orderedIds: string[]
  ) => {
    if (move.projectId) {
      await moveProjectGoal(move.projectId, {
        goalId: move.goalId,
        displacedGoalId: move.displacedGoalId,
        expectedRevision: revision,
      })
      return
    }

    await updateGoalOrder(orderedIds, revision)
  }

  const moveGoal = async (move: GoalOrderMove): Promise<boolean> => {
    if (!isAuthenticated || move.goalId === move.displacedGoalId) return false

    const before =
      cachedOrder(queryClient) ??
      (await queryClient.fetchQuery(goalQueries.list(false)))
    const ids = inFlightInGlobalOrder(before.goals).map((goal) => goal.goalId)
    // The complete order this gesture produces, captured now: a later gesture's optimistic write must
    // not leak into what this request submits.
    const movedIds = moveOntoDisplaced(ids, move.goalId, move.displacedGoalId)
    if (movedIds === null) {
      // Either goal left the in-flight order since the gesture began: nothing to move.
      setConflict(null)
      return false
    }

    const revision = before.orderRevision
    setConflict(null)
    const snapshots = applyOptimisticMove(queryClient, move)
    setPendingCount((count) => count + 1)
    outstanding.current += 1

    const outcome = queue.current.then(async () => {
      try {
        await send(move, revision, movedIds)
        if (outstanding.current === 1) await refresh()
        return true
      } catch (error) {
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data)
        }
        const stale = goalOrderConflict(error)
        if (stale) {
          // Adopt the order as it stands; the attempted move waits for an explicit retry.
          adoptOrder(queryClient, stale.current)
          setConflict({ move, message: (error as ApiError).message })
        } else {
          toast.error(
            error instanceof ApiError
              ? error.message
              : t("goals.toasts.actionError")
          )
        }
        return false
      } finally {
        outstanding.current -= 1
        setPendingCount((count) => Math.max(0, count - 1))
      }
    })
    queue.current = outcome
    return outcome
  }

  const retry = async () => {
    if (!conflict) return false
    return moveGoal(conflict.move)
  }

  return {
    moveGoal,
    pending: pendingCount > 0,
    conflict,
    retry,
    dismissConflict: () => setConflict(null),
  }
}
