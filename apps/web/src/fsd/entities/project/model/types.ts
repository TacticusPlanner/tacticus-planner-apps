export type ProjectSummary = {
  projectId: string
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  isDefault: boolean
  revision: number
  createdAt: string
  updatedAt: string
}

export type CreateProjectRequest = {
  name: string
  description?: string | null
  color?: string | null
}

export type UpdateProjectRequest = {
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  revision: number
}

/** A membership-replacement request (`updateProjectGoals`) sends only the goal id — membership never
 *  changes the account-wide order. In a response `globalPriority` is the goal's position in that order
 *  (null once completed/archived). */
export type ProjectGoalEntry = {
  goalId: string
  globalPriority?: number | null
}

/** `PUT /me/projects/{id}/goals`: `goals` is the complete desired membership and `expectedGoalIds` the
 *  complete membership the user reviewed — the server rejects the whole save (409
 *  `projectMembershipStale`) when the current membership no longer matches it. */
export type UpdateProjectGoalsRequest = {
  goals: { goalId: string }[]
  expectedGoalIds: string[]
}

/** The 409 body of a stale `expectedGoalIds`: the project's membership as it now stands. */
export type ProjectMembershipStaleDto = {
  issueCode: "projectMembershipStale"
  message: string
  projectId: string
  currentGoalIds: string[]
}

/** The 400 body of a removal that would leave goals in no project: the goals blocking the save. */
export type ProjectLastMembershipDto = {
  issueCode: "lastProjectMembership"
  message: string
  blockedGoalIds: string[]
}

// Mirrors the backend's GoalSummaryResponse shape (also duplicated in entities/goal/model/types.ts as
// GoalSummary) — FSD forbids cross-entity imports, so each entity that references another by value keeps
// its own copy of the shape it needs rather than importing the other entity's type.
export type ProjectMemberGoal = {
  goalId: string
  entityType: string
  entityId: string
  goalType: string
  status: string
  notes: string | null
  dependsOn: string[]
  createdAt: string
  updatedAt: string
  /** Position in the account-wide in-flight order; null for Completed/Archived. */
  globalPriority: number | null
}

/** A project's member goals as a filtered projection of the global order (in-flight goals first, in
 * global order). A project has no order of its own. */
export type ProjectGoalSummary = {
  goal: ProjectMemberGoal
}

export type ProjectGoalsResponse = {
  goals: ProjectGoalSummary[]
  orderRevision: number
}

/** Moves `goalId` to the global position `displacedGoalId` holds (both in-flight members of the
 * project); goals between them shift one place toward the vacated slot. */
export type MoveProjectGoalRequest = {
  goalId: string
  displacedGoalId: string
  expectedRevision: number
}
