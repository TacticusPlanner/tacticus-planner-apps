import { apiClient, unwrap } from "@/shared/api"

import type {
  CreateCombinedGoalsRequest,
  EditGoalRequest,
  UpdateGoalsStatusRequest,
} from "../model/types"

export function listGoals(options?: {
  archived?: boolean
  signal?: AbortSignal
}) {
  return unwrap(
    apiClient().GET("/api/v1/goals", {
      params: { query: options?.archived ? { archived: true } : undefined },
      signal: options?.signal,
    })
  )
}

export function getGoal(goalId: string, signal?: AbortSignal) {
  return unwrap(
    apiClient().GET("/api/v1/goals/{goalId}", {
      params: { path: { goalId } },
      signal,
    })
  )
}

/** Creates one goal, or several linked goals of one unit (`dependsOnIndex`), in one request. */
export function createCombinedGoals(request: CreateCombinedGoalsRequest) {
  return unwrap(apiClient().POST("/api/v1/goals", { body: request }))
}

/** Applies every present section of `request` (target, details, projects, priority) to the goal in one
 * atomic call; absent sections are unchanged. Failures change nothing: 400 (`errors` map keyed by
 * section), 404, or a 409 problem: `goalRevisionStale` or `slotOccupied` (`current` is the goal),
 * `goalOrderStale` (`current` is the order). */
export function editGoal(goalId: string, request: EditGoalRequest) {
  return unwrap(
    apiClient().PUT("/api/v1/goals/{goalId}", {
      params: { path: { goalId } },
      body: request,
    })
  )
}

/** Transitions every listed goal to `status` atomically: a rejection (`slotOccupied`, `goalOrderStale`)
 * changes none of them. */
export function updateGoalsStatus(request: UpdateGoalsStatusRequest) {
  return unwrap(apiClient().POST("/api/v1/goals/status", { body: request }))
}

/** Reorders the account's complete in-flight goal set. `goalIds` must be exactly the current Active and
 * Paused goals; a stale revision or set is a 409 (see `goalOrderConflictDetails`) and changes nothing. */
export function updateGoalOrder(goalIds: string[], expectedRevision: number) {
  return unwrap(
    apiClient().PUT("/api/v1/goals/order", {
      body: { goalIds, expectedRevision },
    })
  )
}

export function deleteGoal(goalId: string) {
  return unwrap(
    apiClient().DELETE("/api/v1/goals/{goalId}", {
      params: { path: { goalId } },
    })
  )
}
