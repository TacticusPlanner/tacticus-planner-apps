import type { GoalRevisionConflictDto } from "./types"

/** Narrows an `ApiError.details` body to the stale-revision 409 of `PUT /me/goals/{id}/target`, or
 * null for any other error (including the `projectGoalSlotOccupied` 409 the same endpoint can return —
 * distinguish the two by `issueCode`). */
export function goalRevisionConflictDetails(
  details: unknown
): GoalRevisionConflictDto | null {
  if (!details || typeof details !== "object") return null
  const value = details as Partial<GoalRevisionConflictDto>
  return value.issueCode === "goalRevisionStale" &&
    typeof value.message === "string" &&
    !!value.goal &&
    typeof value.goal === "object"
    ? (value as GoalRevisionConflictDto)
    : null
}
