import { updateProjectGoals } from "../api/project.api"
import { projectMembershipConflict } from "./project-membership-conflict"

/** What one membership change did: the members before and after (both complete id lists). */
export type ProjectMembershipChange = {
  before: string[]
  after: string[]
}

/**
 * Applies `change` to a project's membership in one `PUT me/projects/{id}/goals` (atomic: any rejection
 * changes nothing). `currentGoalIds` is the membership the caller holds (the project's `goalIds`) and is
 * sent as `expectedGoalIds`; if the server's differs (a `membershipStale` 409 — another change landed, or
 * the project also holds archived goals the caller's list leaves out), `change` is re-applied once to the
 * membership that 409 reports and resubmitted. When `change` leaves the set as is, nothing is sent. Every
 * other rejection (`lastProjectMembership`, …) is thrown unchanged for the caller to report.
 */
export async function changeProjectMembership(
  projectId: string,
  currentGoalIds: readonly string[],
  change: (current: readonly string[]) => string[]
): Promise<ProjectMembershipChange> {
  try {
    return await submit(projectId, [...currentGoalIds], change)
  } catch (error) {
    const stale = projectMembershipConflict(error)
    if (!stale) throw error
    return submit(projectId, stale.current.goalIds, change)
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
