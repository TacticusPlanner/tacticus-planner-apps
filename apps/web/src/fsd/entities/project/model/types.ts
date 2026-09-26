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
