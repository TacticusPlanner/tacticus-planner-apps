import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateCombinedGoalsRequest,
  EditGoalRequest,
  EditGoalResponse,
  GoalDetail,
  GoalListResponse,
  GoalOrderResponse,
  UpdateGoalsStatusRequest,
  UpdateGoalsStatusResponse,
} from "../model/types"

export function listGoals(options?: {
  archived?: boolean
  signal?: AbortSignal
}) {
  return apiGet<GoalListResponse>(
    `/api/v1/me/goals${options?.archived ? "?archived=true" : ""}`,
    { signal: options?.signal }
  )
}

export function getGoal(goalId: string, signal?: AbortSignal) {
  return apiGet<GoalDetail>(`/api/v1/me/goals/${goalId}`, { signal })
}

/** Creates one goal, or several linked goals of one unit (`dependsOnIndex`), in one request. */
export function createCombinedGoals(request: CreateCombinedGoalsRequest) {
  return apiPost<{ goals: GoalDetail[] }>("/api/v1/me/goals", {
    body: request,
  })
}

/** Applies every present section of `request` (target, details, projects, priority) to the goal in one
 * atomic call; absent sections are unchanged. Failures change nothing: 400 (`errors` map keyed by
 * section), 404, or a 409 problem: `goalRevisionStale` or `slotOccupied` (`current` is the goal),
 * `goalOrderStale` (`current` is the order). */
export function editGoal(goalId: string, request: EditGoalRequest) {
  return apiPut<EditGoalResponse>(`/api/v1/me/goals/${goalId}`, {
    body: request,
  })
}

/** Transitions every listed goal to `status` atomically: a rejection (`slotOccupied`, `goalOrderStale`)
 * changes none of them. */
export function updateGoalsStatus(request: UpdateGoalsStatusRequest) {
  return apiPost<UpdateGoalsStatusResponse>("/api/v1/me/goals/status", {
    body: request,
  })
}

/** Reorders the account's complete in-flight goal set. `goalIds` must be exactly the current Active and
 * Paused goals; a stale revision or set is a 409 (see `goalOrderConflictDetails`) and changes nothing. */
export function updateGoalOrder(goalIds: string[], expectedRevision: number) {
  return apiPut<GoalOrderResponse>("/api/v1/me/goals/order", {
    body: { goalIds, expectedRevision },
  })
}

export function deleteGoal(goalId: string) {
  return apiDelete(`/api/v1/me/goals/${goalId}`, {})
}
