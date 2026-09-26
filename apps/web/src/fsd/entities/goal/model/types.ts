import type { GoalGroupValue } from "../ui/goal-filters"

/** Type guard for a value read back from persisted storage (`usePersistedSelection`) — callers
 *  that remember the user's Group selection across visits use this to validate what they read. */
export function isGoalGroupValue(value: unknown): value is GoalGroupValue {
  return value === "none" || value === "unit" || value === "type"
}

// Mirrors the backend's persistence-local GoalEntityType/GoalType/GoalStatus/GoalEventType enums,
// serialized by their C# names (System.Text.Json's default camelCase policy only affects property names,
// not enum values).
export type GoalEntityType = "Character" | "Mow"
export type GoalKind = "Rank" | "Ascension" | "Ability" | "Unlock" | "Upgrade"
export type FarmingStrategy =
  "TotalUpgrades" | "EveryStep" | "Milestones" | "MajorMilestones"
export type GoalStatus = "Active" | "Paused" | "Completed" | "Archived"
export type GoalEventType =
  | "Created"
  | "Paused"
  | "Resumed"
  | "PriorityChanged"
  | "Completed"
  | "Archived"
  | "TargetChanged"

export type RankTarget = {
  start: number
  startPointFive: boolean
  startAppliedUpgrades: number
  end: number
  endPointFive: boolean
  endAppliedUpgrades: number
}

export type ProgressionTarget = {
  start: string
  end: string
}

export type AbilityTarget = {
  activeStart: number
  activeEnd: number
  passiveStart: number
  passiveEnd: number
}

// The server's growable acquisition-source allow-list — kept as `string` rather than a union so
// adding a value there (e.g. a future "Incursion", tacticus-planner-apps#106) needs no client type
// change. `ids` holds campaign battle ids for "Campaign", shop-offer ids (`<shopId>:<rewardType>`)
// for "Shop", and is empty for run-based kinds ("Onslaught").
export type AcquisitionSource = {
  kind: string
  ids: string[]
}

export type UpgradeMaterialTarget = {
  upgradeId: string
  quantity: number
}

export type UpgradeTarget = {
  targets: UpgradeMaterialTarget[]
}

export type GoalConfig = {
  rank: RankTarget | null
  progression: ProgressionTarget | null
  ability: AbilityTarget | null
  farmingStrategy: FarmingStrategy
  // Unlock/Ascension shard-source selection (Campaigns/Onslaught/Shops picker). Null/absent means
  // unrestricted campaign farming — the pre-picker default.
  acquisitionSources: AcquisitionSource[] | null
  // Campaign battle ids (opaque string codes) a Rank/Ability goal farms its upgrade materials from;
  // empty/null means auto lowest-energy selection. Unlock/Ascension's shard-node role moved to
  // `acquisitionSources`.
  farmingLocationIds: string[] | null
  upgrade: UpgradeTarget | null
}

export type GoalSnapshot = {
  initialRank: string | null
  initialProgression: string | null
  initialActiveAbilityLevel: number | null
  initialPassiveAbilityLevel: number | null
  initialRequirement: GoalSnapshotResource[]
  initialInventoryContribution: GoalSnapshotResource[]
}

export type GoalSnapshotResource = {
  resourceId: string
  count: number
}

export type CreateGoalSnapshotRequest = GoalSnapshot

/** A goal's *end* target at one moment — only the fields of the goal's own kind are non-null. The
 * server records one before and one after on a `TargetChanged` event. */
export type GoalTargetSnapshot = {
  rankEnd: number | null
  rankEndPointFive: boolean | null
  rankEndAppliedUpgrades: number | null
  progressionEnd: string | null
  activeAbilityEnd: number | null
  passiveAbilityEnd: number | null
  upgradeTargets: UpgradeMaterialTarget[] | null
}

export type GoalEvent = {
  at: string
  type: GoalEventType
  // Set only on a `TargetChanged` event (absent on every other event and on events recorded before
  // target editing existed).
  previousTarget?: GoalTargetSnapshot | null
  newTarget?: GoalTargetSnapshot | null
}

export type GoalSummary = {
  goalId: string
  entityType: GoalEntityType
  entityId: string
  goalType: GoalKind
  status: GoalStatus
  notes: string | null
  dependsOn: string[]
  createdAt: string
  updatedAt: string
}

export type GoalDetail = GoalSummary & {
  config: GoalConfig
  snapshot: GoalSnapshot | null
  events: GoalEvent[]
  dependsOn: string[]
  // The ids of every project this goal currently belongs to (a goal may belong to several projects at
  // once) — populated by the backend's GoalMapper.ToDetail.
  projectIds: string[]
  // Monotonically increasing; a target edit echoes the revision it was loaded with so the server can
  // refuse to overwrite a newer edit.
  revision: number
}

export type CreateGoalConfigRequest = {
  rank?: RankTarget | null
  progression?: ProgressionTarget | null
  ability?: AbilityTarget | null
  farmingStrategy?: FarmingStrategy
  acquisitionSources?: AcquisitionSource[] | null
  farmingLocationIds?: string[] | null
  upgrade?: UpgradeTarget | null
}

/** One project membership for a newly created goal. Unit placement is assigned automatically. */
export type ProjectMembership = {
  projectId: string
}

export type CreateGoalRequest = {
  entityType: string
  entityId: string
  goalType: string
  config: CreateGoalConfigRequest
  // Omitted/empty falls back to the caller's default project; otherwise the goal is added to every
  // listed project (a goal may belong to several projects at once).
  projects?: ProjectMembership[] | null
  snapshot?: CreateGoalSnapshotRequest | null
  // Creates the goal Paused instead of Active. Omitted means Active — membership decides nothing about
  // status, so the goal is Active whichever projects it is filed into.
  startPaused?: boolean
}

/** The end-target group of a target edit — exactly the one matching the goal's kind is set; the
 * start/baseline is not editable and is never sent. */
export type GoalTargetEdit = {
  rank?: { end: number; endPointFive: boolean; endAppliedUpgrades: number }
  progression?: { end: string }
  ability?: { activeEnd: number; passiveEnd: number }
  upgrade?: UpgradeTarget
}

export type UpdateGoalTargetRequest = {
  expectedRevision: number
  target: GoalTargetEdit
}

/** 409 body of `PUT /me/goals/{id}/target` when `expectedRevision` is stale: the goal as it is now. */
export type GoalRevisionConflictDto = {
  issueCode: "goalRevisionStale"
  message: string
  goal: GoalDetail
}

export type UpdateGoalRequest = {
  notes: string | null
  farmingLocationIds: string[] | null
  farmingStrategy?: FarmingStrategy
  acquisitionSources?: AcquisitionSource[] | null
}

/** One goal within a combined-creation request (plan §6/§16 phase 5). `dependsOnIndex` holds indices
 * into the parent request's `goals` array — each must reference a strictly earlier position; the server
 * resolves them into real goal ids. */
export type CombinedGoalSpec = {
  goalType: string
  config: CreateGoalConfigRequest
  dependsOnIndex: number[]
  snapshot?: CreateGoalSnapshotRequest | null
}

export type CreateCombinedGoalsRequest = {
  entityType: string
  entityId: string
  // Same fallback and multi-project semantics as CreateGoalRequest.projects.
  projects?: ProjectMembership[] | null
  goals: CombinedGoalSpec[]
  // Applies to every goal the request creates, prerequisites included — it is not settable per spec.
  startPaused?: boolean
}
