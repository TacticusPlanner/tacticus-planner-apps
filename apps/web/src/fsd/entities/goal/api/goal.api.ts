import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"
import { withAccessToken } from "@/shared/auth"

import type {
  CreateCombinedGoalsRequest,
  CreateGoalRequest,
  GoalDetail,
  GoalStatus,
  GoalSummary,
  UpdateGoalRequest,
} from "../model/types"

export function listGoals(
  instance: IPublicClientApplication,
  account: AccountInfo,
  options?: { archived?: boolean; signal?: AbortSignal }
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiGet<{ goals: GoalSummary[] }>(
      `/api/v1/me/goals${options?.archived ? "?archived=true" : ""}`,
      { accessToken, signal: options?.signal }
    )
  )
}

export function getGoal(
  instance: IPublicClientApplication,
  account: AccountInfo,
  goalId: string
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiGet<GoalDetail>(`/api/v1/me/goals/${goalId}`, { accessToken })
  )
}

export function createGoal(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: CreateGoalRequest
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<GoalDetail>("/api/v1/me/goals", { accessToken, body: request })
  )
}

/** Creates several linked goals for one entity in one call (plan §6, combined creation) — a shared
 * aggregateId and dependsOn edges resolved from each spec's dependsOnIndex. See `CreateCombinedGoalsRequest`. */
export function createCombinedGoals(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: CreateCombinedGoalsRequest
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<{ goals: GoalDetail[] }>("/api/v1/me/goals/combined", {
      accessToken,
      body: request,
    })
  )
}

export function updateGoal(
  instance: IPublicClientApplication,
  account: AccountInfo,
  goalId: string,
  request: UpdateGoalRequest
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPut<GoalDetail>(`/api/v1/me/goals/${goalId}`, {
      accessToken,
      body: request,
    })
  )
}

export function updateGoalStatus(
  instance: IPublicClientApplication,
  account: AccountInfo,
  goalId: string,
  status: GoalStatus
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<GoalDetail>(`/api/v1/me/goals/${goalId}/status`, {
      accessToken,
      body: { status },
    })
  )
}

// Permanently deletes the goal (a hard delete — there is no soft-delete/purge distinction).
export function deleteGoal(
  instance: IPublicClientApplication,
  account: AccountInfo,
  goalId: string
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiDelete(`/api/v1/me/goals/${goalId}`, { accessToken })
  )
}
