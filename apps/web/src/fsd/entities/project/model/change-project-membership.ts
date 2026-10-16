import { ApiError } from "@/shared/api"

import { listProjectGoals, updateProjectGoals } from "../api/project.api"
import { projectMembershipStaleDetails } from "./project-membership-conflict"

/** What one membership change did: the members before and after (both complete id lists). */
export type ProjectMembershipChange = {
  before: string[]
  after: string[]
}

/**
 * Applies `change` to a project's membership as it stands now, in one `PUT me/projects/{id}/goals`
 * (atomic: any rejection changes nothing). The current membership is read first and sent as
 * `expectedGoalIds`; if another change lands in between (a `projectMembershipStale` 409), `change` is
 * re-applied once to the membership that 409 reports and resubmitted. When `change` leaves the set as
 * is, nothing is sent. Every other rejection (`lastProjectMembership`, `projectGoalSlotOccupied`, …)
 * is thrown unchanged for the caller to report.
 */
export async function changeProjectMembership(
  projectId: string,
  change: (current: readonly string[]) => string[]
): Promise<ProjectMembershipChange> {
  const { goals } = await listProjectGoals(projectId)
  const current = goals.map((entry) => entry.goal.goalId)
  try {
    return await submit(projectId, current, change)
  } catch (error) {
    const stale =
      error instanceof ApiError
        ? projectMembershipStaleDetails(error.details)
        : null
    if (!stale) throw error
    return submit(projectId, stale.currentGoalIds, change)
  }
}

async function submit(
  projectId: string,
  current: string[],
  change: (current: readonly string[]) => string[]
): Promise<ProjectMembershipChange> {
  const after = [...new Set(change(current))]
  const unchanged =
    after.length === current.length &&
    after.every((goalId) => current.includes(goalId))
  if (!unchanged) {
    await updateProjectGoals(projectId, {
      goals: after.map((goalId) => ({ goalId })),
      expectedGoalIds: current,
    })
  }
  return { before: current, after: unchanged ? current : after }
}
