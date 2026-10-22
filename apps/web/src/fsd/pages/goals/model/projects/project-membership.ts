import type { GoalDetail } from "@/entities/goal"
import { apiIssue } from "@/shared/api"

/** The existing goal holding the contested in-flight slot when `error` is a `slotOccupied` 409 (from
 *  goal create, edit or a status change), else null. */
export function goalSlotConflict(
  error: unknown
): { current: GoalDetail } | null {
  const issue = apiIssue(error, "slotOccupied")
  return issue?.current && typeof issue.current === "object"
    ? { current: issue.current as GoalDetail }
    : null
}
