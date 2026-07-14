import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiGet, apiPost, apiPut } from "@/shared/api"
import { withAccessToken } from "@/shared/auth"

import type {
  CreateProjectRequest,
  ProjectGoalEntry,
  ProjectGoalSummary,
  ProjectSummary,
} from "../model/types"

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

export function listProjectGoals(
  instance: IPublicClientApplication,
  account: AccountInfo,
  projectId: string,
  signal?: AbortSignal
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiGet<{ goals: ProjectGoalSummary[] }>(
      `/api/v1/me/projects/${projectId}/goals`,
      { accessToken, signal }
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
