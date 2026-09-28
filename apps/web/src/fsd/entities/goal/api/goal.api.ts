import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateCombinedGoalsRequest,
  CreateGoalRequest,
  GoalDetail,
  GoalListResponse,
  GoalOrderResponse,
  GoalStatus,
  UpdateGoalRequest,
  UpdateGoalTargetRequest,
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

export function createGoal(request: CreateGoalRequest) {
  return apiPost<GoalDetail>("/api/v1/me/goals", { body: request })
}

export function createCombinedGoals(request: CreateCombinedGoalsRequest) {
  return apiPost<{ goals: GoalDetail[] }>("/api/v1/me/goals/combined", {
    body: request,
  })
}

export function updateGoal(goalId: string, request: UpdateGoalRequest) {
  return apiPut<GoalDetail>(`/api/v1/me/goals/${goalId}`, { body: request })
}

/** Changes an Active/Paused goal's end target in place (Rank, Ascension, Ability, Upgrade).
 * Revision-checked: a stale `expectedRevision` is a 409 (`goalRevisionStale`, see
 * `goalRevisionConflictDetails`); a Rank target already held in a shared project is a 409
 * `projectGoalSlotOccupied`. Submitting the target the goal already has is a no-op. */
export function updateGoalTarget(
  goalId: string,
  request: UpdateGoalTargetRequest
) {
  return apiPut<GoalDetail>(`/api/v1/me/goals/${goalId}/target`, {
    body: request,
  })
}

/** Replaces which projects a goal belongs to. A goal must always belong to at least one project — the
 * backend rejects an empty list. */
export function updateGoalProjects(goalId: string, projectIds: string[]) {
  return apiPut<GoalDetail>(`/api/v1/me/goals/${goalId}/projects`, {
    body: { projectIds },
  })
}

export function updateGoalStatus(goalId: string, status: GoalStatus) {
  return apiPost<GoalDetail>(`/api/v1/me/goals/${goalId}/status`, {
    body: { status },
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
