import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateCombinedGoalsRequest,
  CreateGoalRequest,
  GoalDetail,
  GoalStatus,
  GoalSummary,
  UpdateGoalRequest,
} from "../model/types"

export function listGoals(options?: {
  archived?: boolean
  signal?: AbortSignal
}) {
  return apiGet<{ goals: GoalSummary[] }>(
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

export function deleteGoal(goalId: string) {
  return apiDelete(`/api/v1/me/goals/${goalId}`, {})
}
