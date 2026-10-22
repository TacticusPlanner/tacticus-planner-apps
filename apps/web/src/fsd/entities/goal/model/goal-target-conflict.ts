import { apiIssue } from "@/shared/api"

import type { GoalDetail } from "./types"

/** The goal as it stands now when `error` is a `goalRevisionStale` 409 (from the edit route), else null. */
export function goalRevisionConflict(
  error: unknown
): { current: GoalDetail } | null {
  const issue = apiIssue(error, "goalRevisionStale")
  return issue?.current && typeof issue.current === "object"
    ? { current: issue.current as GoalDetail }
    : null
}
