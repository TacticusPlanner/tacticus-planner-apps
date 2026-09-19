import type { GoalKind } from "@/entities/goal"
import type { ProjectGoalSummary, ProjectSummary } from "@/entities/project"

import type { ProjectMembershipConflict } from "./project-membership"
import { findProjectGoalConflicts } from "./use-project-goal-conflicts"

export type ProjectRemovalUnavailableReason =
  /** The goal's only membership *is* the Default project, so relocation has no destination. */
  | "lastMembershipIsDefault"
  /** The Default project isn't known yet — the projects query is pending, errored, or the user is
   *  unauthenticated. Submitting would serialize `[null]` and fail the ownership check with a 400. */
  | "destinationUnknown"

/**
 * What submitting a "remove from this project" would do. `PUT /me/goals/{goalId}/projects` replaces
 * the whole membership list, so every outcome carries the complete list to submit rather than a diff.
 */
export type ProjectRemovalPlan =
  | { kind: "remove"; projectIds: string[] }
  | { kind: "relocate"; projectIds: string[]; destination: ProjectSummary }
  | {
      kind: "conflict"
      conflict: ProjectMembershipConflict
      destination: ProjectSummary
    }
  | { kind: "unavailable"; reason: ProjectRemovalUnavailableReason }

/**
 * Removing a goal's last remaining membership relocates it to the Default project rather than being
 * refused: the server invariant ("a goal belongs to at least one project") is untouched, the client
 * simply never asks for the empty list it rejects.
 *
 * `destinationGoals` is the Default project's current members, needed only to pre-flight the
 * project-scoped `(entityType, entityId, goalType)` slot before a relocation. Pass `[]` at render
 * time (when the menu only needs to know whether the action is available at all) and the freshly
 * fetched members at submit time.
 */
export function planProjectRemoval({
  memberships,
  projectId,
  defaultProject,
  goal,
  destinationGoals = [],
}: {
  memberships: string[]
  projectId: string
  defaultProject: ProjectSummary | undefined
  goal: {
    goalId: string
    entityType: string
    entityId: string
    goalType: GoalKind
    status: string
  }
  destinationGoals?: ProjectGoalSummary[]
}): ProjectRemovalPlan {
  // An empty list means membership hasn't loaded, not that this is the goal's only one — computing a
  // relocation from it would move a multi-project goal into Default. Treated as "destination not
  // determinable" for the same reason as an unknown Default project: nothing can be submitted yet.
  if (memberships.length === 0) {
    return { kind: "unavailable", reason: "destinationUnknown" }
  }

  const remaining = memberships.filter((id) => id !== projectId)
  if (remaining.length > 0) {
    return { kind: "remove", projectIds: remaining }
  }

  if (!defaultProject) {
    return { kind: "unavailable", reason: "destinationUnknown" }
  }
  if (defaultProject.projectId === projectId) {
    return { kind: "unavailable", reason: "lastMembershipIsDefault" }
  }

  // Only an Active or Paused goal occupies a project-scoped goal-type slot, so only it can collide
  // with what the destination already holds — a Completed or Archived goal relocates regardless.
  if (goal.status === "Active" || goal.status === "Paused") {
    const [conflict] = findProjectGoalConflicts({
      selected: [defaultProject],
      projectGoals: [destinationGoals],
      entityType: goal.entityType as "Character" | "Mow",
      entityId: goal.entityId,
      goalTypes: [goal.goalType],
      excludeGoalId: goal.goalId,
    })
    if (conflict) {
      return { kind: "conflict", conflict, destination: defaultProject }
    }
  }

  return {
    kind: "relocate",
    projectIds: [defaultProject.projectId],
    destination: defaultProject,
  }
}
