import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  applyPositionMove,
  goalOrderConflictDetails,
  goalQueries,
  inFlightInGlobalOrder,
  moveOntoDisplaced,
  updateGoalOrder,
  type GoalListResponse,
} from "@/entities/goal"
import {
  moveProjectGoal,
  projectQueries,
  type ProjectGoalsResponse,
} from "@/entities/project"
import { ApiError } from "@/shared/api"

/** One reorder gesture: `goalId` takes the global position `displacedGoalId` holds. With a
 * `projectId` it was made on that project's projection (any hidden goals in between keep their
 * relative order); without one it was made on the complete Global Plan. */
export type GoalOrderMove = {
  goalId: string
  displacedGoalId: string
  projectId?: string
}

/** A move the server rejected because the order changed under the user. The attempted move is kept so
 * the user can review the refreshed order and retry it explicitly; it is never replayed silently. */
export type GoalOrderConflict = { move: GoalOrderMove; message: string }

type Snapshot = { queryKey: readonly unknown[]; data: unknown }

const isProjectGoalsKey = (queryKey: readonly unknown[]) =>
  queryKey[0] === "projects" &&
  queryKey[1] === "detail" &&
  queryKey[3] === "goals"

/** Rewrites every cached view of the order the way the server will persist the move: the global list
 * and each project projection, so all of them agree before the round trip completes. Returns the
 * previous data so a failure can roll back. */
function applyOptimisticMove(
  queryClient: QueryClient,
  move: GoalOrderMove
): Snapshot[] {
  const snapshots: Snapshot[] = []
  const revise = <
    T extends { goals: { goalId: string; globalPriority: number | null }[] },
  >(
    data: T
  ): T => ({
    ...data,
    goals: applyPositionMove(data.goals, move.goalId, move.displacedGoalId),
  })

  for (const [queryKey, data] of queryClient.getQueriesData<GoalListResponse>({
    queryKey: goalQueries.lists(),
  })) {
    if (!data) continue
    snapshots.push({ queryKey, data })
    const moved = revise(data)
    queryClient.setQueryData<GoalListResponse>(queryKey, {
      ...moved,
      goals: [
        ...inFlightInGlobalOrder(moved.goals),
        ...moved.goals.filter((goal) => goal.globalPriority === null),
      ],
      orderRevision: data.orderRevision + 1,
    })
  }

  for (const [
    queryKey,
    data,
  ] of queryClient.getQueriesData<ProjectGoalsResponse>({
    queryKey: projectQueries.all(),
  })) {
    if (!data || !isProjectGoalsKey(queryKey)) continue
    snapshots.push({ queryKey, data })
    const moved = applyPositionMove(
      data.goals.map((entry) => entry.goal),
      move.goalId,
      move.displacedGoalId
    )
    const byId = new Map(moved.map((goal) => [goal.goalId, goal]))
    const ordered = [
      ...inFlightInGlobalOrder(moved),
      ...moved.filter((goal) => goal.globalPriority === null),
    ]
    queryClient.setQueryData<ProjectGoalsResponse>(queryKey, {
      ...data,
      goals: ordered.map((goal) => ({ goal: byId.get(goal.goalId)! })),
      orderRevision: data.orderRevision + 1,
    })
  }

  return snapshots
}

/** The freshest cached order for the view a gesture was made on, if any. Read synchronously so a
 * gesture reads and applies its optimistic write with nothing in between: a second gesture then always
 * starts from the first one's result. */
function cachedOrder(queryClient: QueryClient, move: GoalOrderMove) {
  return move.projectId
    ? queryClient.getQueryData<ProjectGoalsResponse>(
        projectQueries.goals(move.projectId).queryKey
      )
    : queryClient.getQueryData<GoalListResponse>(
        goalQueries.list(false).queryKey
      )
}

/**
 * Reorder gestures on the account-wide goal order, from either the Global Plan or a project's
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

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
      queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
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
      cachedOrder(queryClient, move) ??
      (move.projectId
        ? await queryClient.fetchQuery(projectQueries.goals(move.projectId))
        : await queryClient.fetchQuery(goalQueries.list(false)))
    const goals = "orderRevision" in before ? before.goals : []
    const ids = inFlightInGlobalOrder(
      goals.map((entry) => ("goal" in entry ? entry.goal : entry))
    ).map((goal) => goal.goalId)
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

    const outcome = queue.current.then(async () => {
      try {
        await send(move, revision, movedIds)
        await refresh()
        return true
      } catch (error) {
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data)
        }
        const details =
          error instanceof ApiError
            ? goalOrderConflictDetails(error.details)
            : null
        if (details) {
          setConflict({ move, message: details.message })
          await refresh()
        } else {
          toast.error(
            error instanceof ApiError
              ? error.message
              : t("goals.toasts.actionError")
          )
        }
        return false
      } finally {
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
