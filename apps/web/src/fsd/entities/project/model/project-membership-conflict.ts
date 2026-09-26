import type {
  ProjectLastMembershipDto,
  ProjectMembershipStaleDto,
} from "./types"

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string")

/** Narrows an `ApiError.details` body to the stale-membership 409 of `updateProjectGoals`, or null for any
 * other error (including the slot-conflict 409 the same endpoint can return — distinguish by `issueCode`). */
export function projectMembershipStaleDetails(
  details: unknown
): ProjectMembershipStaleDto | null {
  if (!details || typeof details !== "object") return null
  const value = details as Partial<ProjectMembershipStaleDto>
  return value.issueCode === "projectMembershipStale" &&
    typeof value.message === "string" &&
    isStringArray(value.currentGoalIds)
    ? (value as ProjectMembershipStaleDto)
    : null
}

/** Narrows an `ApiError.details` body to the last-membership 400 of `updateProjectGoals`, or null. */
export function projectLastMembershipDetails(
  details: unknown
): ProjectLastMembershipDto | null {
  if (!details || typeof details !== "object") return null
  const value = details as Partial<ProjectLastMembershipDto>
  return value.issueCode === "lastProjectMembership" &&
    typeof value.message === "string" &&
    isStringArray(value.blockedGoalIds)
    ? (value as ProjectLastMembershipDto)
    : null
}

/** The goal ids a `projectGoalSlotOccupied` 409 names as holding the contested slot, or null for any other
 * error. */
export function projectSlotConflictGoalIds(details: unknown): string[] | null {
  if (!details || typeof details !== "object") return null
  const value = details as {
    issueCode?: unknown
    existingGoalId?: unknown
    conflicts?: { existingGoalId?: unknown }[] | null
  }
  if (
    value.issueCode !== "projectGoalSlotOccupied" ||
    typeof value.existingGoalId !== "string"
  ) {
    return null
  }
  const ids = [value.existingGoalId]
  for (const entry of value.conflicts ?? []) {
    if (typeof entry.existingGoalId === "string") ids.push(entry.existingGoalId)
  }
  return [...new Set(ids)]
}
