import type { ApiSchemas } from "@/shared/api"

import type { GoalGroupValue, GoalTypeFilterValue } from "../ui/goal-filters"
import type { GoalStatusFilterValue } from "../ui/status-filter-select"

/** Type guard for a value read back from persisted storage (`usePersistedSelection`) — callers
 *  that remember the user's Group selection across visits use this to validate what they read. */
export function isGoalGroupValue(value: unknown): value is GoalGroupValue {
  return value === "none" || value === "unit" || value === "type"
}

export const STATUS_VALUES: readonly GoalStatusFilterValue[] = [
  "all",
  "toReach",
  "reached",
  "blocked",
  "active",
  "paused",
]

export const GOAL_TYPE_VALUES: readonly GoalKind[] = [
  "Rank",
  "Ascension",
  "Ability",
  "Unlock",
  "Upgrade",
]

/** Type guard for a value read back from the URL (`?status=` on the Goals page). */
export function isGoalStatusFilterValue(
  value: string
): value is GoalStatusFilterValue {
  return (STATUS_VALUES as readonly string[]).includes(value)
}

/** Type guard for a value read back from the URL (`?type=` on the Goals page). */
export function isGoalTypeFilterValue(
  value: string
): value is GoalTypeFilterValue {
  return (
    value === "all" || (GOAL_TYPE_VALUES as readonly string[]).includes(value)
  )
}

// Wire shapes, generated from the API's OpenAPI document (spec: api-contract-sync); never hand-written.
type S = ApiSchemas

export type GoalEntityType = S["GoalEntityType"]
export type GoalKind = S["GoalType"]
export type FarmingStrategy = S["FarmingStrategy"]
export type GoalStatus = S["GoalStatus"]

export type RankTarget = S["RankTargetResponse"]
export type ProgressionTarget = S["ProgressionTargetResponse"]
/** `ids` holds campaign battle ids for "Campaign", shop-offer ids (`<shopId>:<rewardType>`) for "Shop",
 *  and is empty for run-based kinds ("Onslaught"). */
export type AcquisitionSource = S["AcquisitionSourceResponse"]
/** Rank indices for a Character, ability levels for one Machine of War track; `null` means no range. */
export type UpgradeRange = S["UpgradeRangeResponse"]
export type UpgradeTarget = S["UpgradeTargetResponse"]
/** `acquisitionSources` null means unrestricted campaign farming; `farmingLocationIds` null means auto
 *  lowest-energy selection. */
export type GoalConfig = S["GoalConfigResponse"]
export type CreateGoalSnapshotRequest = S["CreateGoalSnapshotRequest"]

/** A goal in full, as the list and every mutation serve it. `globalPriority` is its 1-based position in
 *  the account-wide in-flight order (null for Completed/Archived); an edit echoes `revision`. */
export type GoalDetail = S["GoalDetailResponse"]
/** In-flight goals first in global order, then the rest; reorders echo `orderRevision`. */
export type GoalListResponse = S["ListGoalsResponse"]
/** One atomic transition; `expectedOrderRevision` is required when entering or leaving the in-flight set. */
export type UpdateGoalsStatusRequest = S["UpdateGoalsStatusRequest"]
export type GoalOrderResponse = S["GoalOrderResponse"]
export type CreateGoalConfigRequest = S["CreateGoalConfigRequest"]
export type ProjectMembership = S["ProjectPriorityRequest"]
/** Exactly the group matching the goal's kind is set; only end values are editable. */
export type GoalTargetEdit = S["GoalTargetEditRequest"]
/** Every section is optional; present sections apply all-or-nothing. */
export type EditGoalRequest = S["EditGoalRequest"]
/** `dependsOnIndex` holds indices of strictly earlier specs in the same request. */
export type CombinedGoalSpec = S["CombinedGoalSpec"]
export type CreateCombinedGoalsRequest = S["CreateCombinedGoalsRequest"]
