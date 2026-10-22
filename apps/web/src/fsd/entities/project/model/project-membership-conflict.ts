import { apiIssue } from "@/shared/api"

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string")

/** The project's membership as it now stands when `error` is a `membershipStale` 409 of
 *  `updateProjectGoals`, else null. */
export function projectMembershipConflict(
  error: unknown
): { message: string; current: { goalIds: string[] } } | null {
  const issue = apiIssue(error, "membershipStale")
  const goalIds = (issue?.current as { goalIds?: unknown } | undefined)?.goalIds
  return issue && isStringArray(goalIds)
    ? { message: issue.message, current: { goalIds } }
    : null
}

/** The goals blocking a removal when `error` is the `lastProjectMembership` 400 of
 *  `updateProjectGoals` (a removal would leave them in no project), else null. */
export function projectLastMembership(
  error: unknown
): { message: string; blockedGoalIds: string[] } | null {
  const issue = apiIssue(error, "lastProjectMembership")
  const blockedGoalIds = issue?.extensions.blockedGoalIds
  return issue && isStringArray(blockedGoalIds)
    ? { message: issue.message, blockedGoalIds }
    : null
}
