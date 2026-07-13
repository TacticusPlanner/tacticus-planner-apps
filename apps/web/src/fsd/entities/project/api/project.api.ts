import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiGet, apiPost, apiPut } from "@/shared/api"
import { acquireAccessToken } from "@/shared/auth"

export type ProjectSummary = {
  projectId: string
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  isActivePlan: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateProjectRequest = {
  name: string
  description?: string | null
  color?: string | null
}

export type ProjectGoalEntry = {
  goalId: string
  priority: number
}

export function listProjects(
  instance: IPublicClientApplication,
  account: AccountInfo,
  signal?: AbortSignal
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiGet<{ projects: ProjectSummary[] }>("/api/v1/me/projects", {
      accessToken,
      signal,
    })
  )
}

export function createProject(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: CreateProjectRequest
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<ProjectSummary>("/api/v1/me/projects", {
      accessToken,
      body: request,
    })
  )
}

export function activateProject(
  instance: IPublicClientApplication,
  account: AccountInfo,
  projectId: string
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<ProjectSummary>(`/api/v1/me/projects/${projectId}/activate`, {
      accessToken,
    })
  )
}

export function updateProjectGoals(
  instance: IPublicClientApplication,
  account: AccountInfo,
  projectId: string,
  goals: ProjectGoalEntry[]
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPut<{ goals: ProjectGoalEntry[] }>(
      `/api/v1/me/projects/${projectId}/goals`,
      {
        accessToken,
        body: { goals },
      }
    )
  )
}

export function updateProjectGoalsStatus(
  instance: IPublicClientApplication,
  account: AccountInfo,
  projectId: string,
  status: "Active" | "Paused"
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<{ goalsTransitioned: number }>(
      `/api/v1/me/projects/${projectId}/goals/status`,
      {
        accessToken,
        body: { status },
      }
    )
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
