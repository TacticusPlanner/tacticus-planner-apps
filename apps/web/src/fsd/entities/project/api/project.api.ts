import { apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateProjectRequest,
  MoveProjectGoalRequest,
  ProjectGoalEntry,
  ProjectGoalsResponse,
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

export function updateProjectGoals(
  projectId: string,
  goals: ProjectGoalEntry[]
) {
  return apiPut<{ goals: ProjectGoalEntry[] }>(
    `/api/v1/me/projects/${projectId}/goals`,
    { body: { goals } }
  )
}

/** Reorders within a project's projection: writes through to the account-wide order (a 409 with the
 * `goalOrder*` issue codes when the revision or goals are stale). Returns the new order. */
export function moveProjectGoal(
  projectId: string,
  request: MoveProjectGoalRequest
) {
  return apiPut<{ revision: number; goalIds: string[] }>(
    `/api/v1/me/projects/${projectId}/goal-order`,
    { body: request }
  )
}

export function listProjectGoals(projectId: string, signal?: AbortSignal) {
  return apiGet<ProjectGoalsResponse>(
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
