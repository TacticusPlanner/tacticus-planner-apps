/** What a project relates to (project-event-target); `eventId` is a catalog `lres` id. */
export type ProjectTarget = { kind: "legendaryEvent"; eventId: string }

export type ProjectSummary = {
  projectId: string
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  isDefault: boolean
  /** Null or absent when the project relates to nothing. */
  target?: ProjectTarget | null
  revision: number
  createdAt: string
  updatedAt: string
  /** Member goal ids in global order, under the same archived selector as the goals list (non-archived
   *  goals by default); the only membership read, so no per-project request exists. */
  goalIds: string[]
}

export type CreateProjectRequest = {
  name: string
  description?: string | null
  color?: string | null
  target?: ProjectTarget | null
}

export type UpdateProjectRequest = {
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  revision: number
  /** Absent or null clears the target; archiving and restoring must resend it. */
  target: ProjectTarget | null
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
 *  `membershipStale`) when the current membership no longer matches it. */
export type UpdateProjectGoalsRequest = {
  goals: { goalId: string }[]
  expectedGoalIds: string[]
}

/** Moves `goalId` to the global position `displacedGoalId` holds (both in-flight members of the
 * project); goals between them shift one place toward the vacated slot. */
export type MoveProjectGoalRequest = {
  goalId: string
  displacedGoalId: string
  expectedRevision: number
}
