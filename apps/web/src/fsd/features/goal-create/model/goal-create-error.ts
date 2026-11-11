import type { TFunction } from "i18next"

import { isGoalLimitError, MAX_GOALS_PER_TYPE } from "@/entities/goal"
import { ApiError, hasProblemText, isTransientApiError } from "@/shared/api"

import { projectConflictText } from "@/features/goal-planning/@x/goal-create"
import { goalSlotConflict } from "@/features/goal-planning/@x/goal-create"

/**
 * What a failed goal creation tells the user, for the create sheet and the bulk dialog alike: a slot
 * conflict names the existing goal, the per-type cap is translated, a server or network failure (the
 * request may simply be retried) gets its own copy instead of "API request failed with status 503",
 * a 4xx keeps the API's own sentence (not the client's "status 4xx" fallback), and anything else reads as a generic failure.
 */
export function goalCreateErrorText(
  t: TFunction,
  error: unknown,
  getUnitName: (entityType: string | null, entityId: string | null) => string
): string {
  const conflict = goalSlotConflict(error)
  if (conflict) {
    return projectConflictText(
      t,
      conflict.current,
      getUnitName(conflict.current.entityType, conflict.current.entityId)
    )
  }
  if (isGoalLimitError(error)) {
    return t("goals.limits.goalLimitReachedGeneric", {
      max: MAX_GOALS_PER_TYPE,
    })
  }
  if (isTransientApiError(error)) return t("goals.create.serverError")
  if (error instanceof ApiError && hasProblemText(error)) return error.message
  return t("goals.create.genericError")
}
