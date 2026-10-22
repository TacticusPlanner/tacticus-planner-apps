import { apiClient, unwrap } from "@/shared/api"

import type {
  CreateProjectRequest,
  MoveProjectGoalRequest,
  UpdateProjectGoalsRequest,
  UpdateProjectRequest,
} from "../model/types"

export function listProjects(signal?: AbortSignal) {
  return unwrap(apiClient().GET("/api/v1/projects", { signal }))
}

export function createProject(request: CreateProjectRequest) {
  return unwrap(apiClient().POST("/api/v1/projects", { body: request }))
}

export function updateProject(
  projectId: string,
  request: UpdateProjectRequest
) {
  return unwrap(
    apiClient().PUT("/api/v1/projects/{projectId}", {
      params: { path: { projectId } },
      body: request,
    })
  )
}

/** Atomically replaces a project's membership. `request.expectedGoalIds` is the membership the user
 * reviewed: a mismatch is a 409 `projectMembershipStale` (see `projectMembershipStaleDetails`); a removal
 * that would leave a goal in no project is a 400 `lastProjectMembership`. Never reorders anything. */
export function updateProjectGoals(
  projectId: string,
  request: UpdateProjectGoalsRequest
) {
  return unwrap(
    apiClient().PUT("/api/v1/projects/{projectId}/goals", {
      params: { path: { projectId } },
      body: request,
    })
  )
}

/** Reorders within a project's projection: writes through to the account-wide order (a 409 with the
 * `goalOrder*` issue codes when the revision or goals are stale). Returns the new order. */
export function moveProjectGoal(
  projectId: string,
  request: MoveProjectGoalRequest
) {
  return unwrap(
    apiClient().PUT("/api/v1/projects/{projectId}/goal-order", {
      params: { path: { projectId } },
      body: request,
    })
  )
}
