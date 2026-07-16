import { apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateProjectRequest,
  ProjectGoalEntry,
  ProjectGoalSummary,
  ProjectSummary,
  UpdateProjectRequest,
} from "../model/types"

export function listProjects(signal?: AbortSignal) {
  return apiGet<{ projects: ProjectSummary[] }>("/api/v1/me/projects", {
    signal,
  })
}

export function createProject(request: CreateProjectRequest) {
  return apiPost<ProjectSummary>("/api/v1/me/projects", { body: request })
}

export function updateProject(
  projectId: string,
  request: UpdateProjectRequest
) {
  return apiPut<ProjectSummary>(`/api/v1/me/projects/${projectId}`, {
    body: request,
  })
}

export function activateProject(projectId: string) {
  return apiPost<ProjectSummary>(
    `/api/v1/me/projects/${projectId}/activate`,
    {}
  )
}

export function updateProjectGoals(
  projectId: string,
  goals: ProjectGoalEntry[]
) {
  return apiPut<{ goals: ProjectGoalEntry[] }>(
    `/api/v1/me/projects/${projectId}/goals`,
    { body: { goals } }
  )
}

export function listProjectGoals(projectId: string, signal?: AbortSignal) {
  return apiGet<{ goals: ProjectGoalSummary[] }>(
    `/api/v1/me/projects/${projectId}/goals`,
    { signal }
  )
}

export function updateProjectGoalsStatus(
  projectId: string,
  status: "Active" | "Paused"
) {
  return apiPost<{ goalsTransitioned: number }>(
    `/api/v1/me/projects/${projectId}/goals/status`,
    { body: { status } }
  )
}
