export type ProjectSummary = {
  projectId: string
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  isActivePlan: boolean
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

/** `priority` is optional because it's meaningful only as a *response* value (goal-order is now the
 *  only way to set it, see `updateProjectGoalOrder`) — a membership-replacement request
 *  (`updateProjectGoals`) never sends it, since the API ignores any submitted value. */
export type ProjectGoalEntry = {
  goalId: string
  priority?: number
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
}

export type ProjectGoalSummary = {
  goal: ProjectMemberGoal
  priority: number
}
