import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"
import { acquireAccessToken } from "@/shared/auth"

// Mirrors the backend's persistence-local GoalEntityType/GoalType/GoalStatus enums, serialized by their
// C# names (System.Text.Json's default camelCase policy only affects property names, not enum values).
export type GoalEntityType = "Character" | "Mow" | "Upgrade"
export type GoalKind =
  "Rank" | "Ascension" | "Ability" | "Unlock" | "Shards" | "Material"
export type GoalStatus =
  "Draft" | "Active" | "Paused" | "Completed" | "Archived" | "Deleted"

export type GoalConfig = {
  rankStart: number | null
  rankStartPointFive: boolean | null
  rankStartAppliedUpgrades: number | null
  rankEnd: number | null
  rankEndPointFive: boolean | null
  rankEndAppliedUpgrades: number | null
  progressionStart: string | null
  progressionEnd: string | null
  abilityActiveStart: number | null
  abilityActiveEnd: number | null
  abilityPassiveStart: number | null
  abilityPassiveEnd: number | null
  shardsTarget: number | null
  farmingMode: string | null
  farmingLocationIds: string[] | null
}

export type GoalMilestone = {
  index: number
  kind: string
  targetState: string
  source: "calculated" | "user"
  status: string
  completedAt: string | null
}

export type GoalSnapshot = {
  createdAt: string
  originalEstimateDays: number | null
  originalEstimateDate: string | null
}

export type GoalEvent = {
  at: string
  type: string
}

export type GoalSummary = {
  goalId: string
  entityType: GoalEntityType
  entityId: string
  goalType: GoalKind
  status: GoalStatus
  notes: string | null
  aggregateId: string | null
  createdAt: string
  updatedAt: string
}

export type GoalDetail = GoalSummary & {
  config: GoalConfig
  milestones: GoalMilestone[]
  snapshot: GoalSnapshot | null
  events: GoalEvent[]
  dependsOn: string[]
}

export type CreateGoalConfigRequest = Partial<
  Pick<
    GoalConfig,
    | "rankStart"
    | "rankStartPointFive"
    | "rankStartAppliedUpgrades"
    | "rankEnd"
    | "rankEndPointFive"
    | "rankEndAppliedUpgrades"
    | "progressionStart"
    | "progressionEnd"
    | "abilityActiveStart"
    | "abilityActiveEnd"
    | "abilityPassiveStart"
    | "abilityPassiveEnd"
    | "shardsTarget"
    | "farmingMode"
    | "farmingLocationIds"
  >
>

export type CreateGoalRequest = {
  entityType: string
  entityId: string
  goalType: string
  config: CreateGoalConfigRequest
  projectId?: string | null
}

export type UpdateGoalRequest = {
  notes: string | null
  farmingMode: string | null
  farmingLocationIds: string[] | null
}

export function listGoals(
  instance: IPublicClientApplication,
  account: AccountInfo,
  signal?: AbortSignal
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiGet<{ goals: GoalSummary[] }>("/api/v1/me/goals", {
      accessToken,
      signal,
    })
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

export function deleteGoal(
  instance: IPublicClientApplication,
  account: AccountInfo,
  goalId: string,
  purge = false
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiDelete(`/api/v1/me/goals/${goalId}${purge ? "?purge=true" : ""}`, {
      accessToken,
    })
  )
}

async function withAccessToken<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  action: (accessToken: string) => Promise<T>
) {
  const accessToken = await acquireAccessToken(instance, account)

  return action(accessToken)
}
