// Mirrors the backend's persistence-local GoalEntityType/GoalType/GoalStatus/GoalEventType enums,
// serialized by their C# names (System.Text.Json's default camelCase policy only affects property names,
// not enum values).
export type GoalEntityType = "Character" | "Mow"
export type GoalKind =
  "Rank" | "Ascension" | "Ability" | "Unlock" | "Upgrade" | "Level"
export type FarmingStrategy =
  "TotalUpgrades" | "EveryStep" | "Milestones" | "MajorMilestones"
export type AscensionFarmingSource = "Campaign" | "Onslaught" | "Both"
export type GoalStatus = "Active" | "Paused" | "Completed" | "Archived"
export type GoalEventType =
  | "Created"
  | "Paused"
  | "Resumed"
  | "PriorityChanged"
  | "Completed"
  | "Archived"

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

/** Target character level (`GoalEntityType` `"Character"` only — see `MAX_CHARACTER_LEVEL`).
 * Uncosted, like Ability — "complete" is simply the player's synced `xpLevel` reaching `end`. */
export type LevelTarget = {
  start: number
  end: number
}

export type AscensionFarmingConfig = {
  source: AscensionFarmingSource
  shardBattleIds: string[]
  mythicShardBattleIds: string[]
}

export type UpgradeMaterialTarget = {
  upgradeId: string
  quantity: number
}

export type UpgradeTarget = {
  targets: UpgradeMaterialTarget[]
}

/** Target level for a specific piece of equipment/relic gear (`GoalEntityType` `"Item"`
 * only). Uncosted — no gold/salvage/mythic-salvage farming engine exists in this app; "complete"
 * is simply the player's synced level for this equipment reaching `targetLevel`. */
export type GoalConfig = {
  rank: RankTarget | null
  progression: ProgressionTarget | null
  ability: AbilityTarget | null
  farmingStrategy: FarmingStrategy
  ascensionFarming: AscensionFarmingConfig | null
  // Campaign battle ids (opaque string codes) the goal is farmed from; empty/null means auto
  // lowest-energy selection.
  farmingLocationIds: string[] | null
  upgrade: UpgradeTarget | null
  level: LevelTarget | null
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

export type GoalEvent = {
  at: string
  type: GoalEventType
}

export type GoalSummary = {
  goalId: string
  entityType: GoalEntityType
  entityId: string
  goalType: GoalKind
  status: GoalStatus
  notes: string | null
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
}

export type CreateGoalConfigRequest = {
  rank?: RankTarget | null
  progression?: ProgressionTarget | null
  ability?: AbilityTarget | null
  farmingStrategy?: FarmingStrategy
  ascensionFarming?: AscensionFarmingConfig | null
  farmingLocationIds?: string[] | null
  upgrade?: UpgradeTarget | null
  level?: LevelTarget | null
}

/** One target project for a newly created goal, with an optional caller-chosen priority within that
 * project (per-project priority). `priority` omitted/null means "append after the project's current
 * goals" — the server's `GetNextPriorityAsync` fallback. */
export type ProjectPriority = {
  projectId: string
}

export type CreateGoalRequest = {
  entityType: string
  entityId: string
  goalType: string
  config: CreateGoalConfigRequest
  // Omitted/empty falls back to the caller's default project; otherwise the goal is added to every
  // listed project (a goal may belong to several projects at once), at that project's given priority
  // when supplied.
  projects?: ProjectPriority[] | null
  snapshot?: CreateGoalSnapshotRequest | null
}

export type UpdateGoalRequest = {
  notes: string | null
  farmingLocationIds: string[] | null
  farmingStrategy?: FarmingStrategy
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
  // Same fallback/multi-project-with-priority semantics as CreateGoalRequest.projects — a given
  // project's priority becomes the base for the whole set, with each later goal placed right after.
  projects?: ProjectPriority[] | null
  goals: CombinedGoalSpec[]
}
