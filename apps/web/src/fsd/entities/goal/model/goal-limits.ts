import { ApiError } from "@/shared/api"

import type { GoalKind } from "./types"

/** The API's per-goal-type cap on goals outside Archived (Active, Paused and Completed count). */
export const MAX_GOALS_PER_TYPE = 200

/** The API's cap on one goal's farming-location overrides. */
export const MAX_FARMING_LOCATIONS = 100

/** The API's cap on a snapshot resource list, and on its ids' length. */
export const MAX_SNAPSHOT_RESOURCES = 250
export const MAX_RESOURCE_ID_LENGTH = 128

/**
 * The goal types that would pass `MAX_GOALS_PER_TYPE` if goals of `adding` types joined the
 * non-archived `existing` ones — the client-side twin of the API's `goalLimitReached`, so a request
 * the API would refuse is not sent.
 */
export function goalTypesOverLimit(
  existing: Iterable<{ goalType: GoalKind }>,
  adding: readonly GoalKind[]
): GoalKind[] {
  if (adding.length === 0) return []
  const counts = new Map<GoalKind, number>()
  for (const { goalType } of existing) {
    counts.set(goalType, (counts.get(goalType) ?? 0) + 1)
  }
  for (const goalType of adding) {
    counts.set(goalType, (counts.get(goalType) ?? 0) + 1)
  }
  return [...new Set(adding)].filter(
    (goalType) => (counts.get(goalType) ?? 0) > MAX_GOALS_PER_TYPE
  )
}

/** Whether `error` is the API's 400 `goalLimitReached`. */
export function isGoalLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.issueCode === "goalLimitReached"
}
