// Mirrors the backend's persistence-local GoalEntityType/GoalType/GoalStatus/GoalEventType enums,
// serialized by their C# names (System.Text.Json's default camelCase policy only affects property names,
// not enum values).
export type GoalEntityType = "Character" | "Mow" | "Equipment"
export type GoalKind =
  "Rank" | "Ascension" | "Ability" | "Unlock" | "Upgrade" | "UpgradeEquipment"
export type FarmingStrategy =
  "TotalUpgrades" | "EveryStep" | "Milestones" | "MajorMilestones"
export type AscensionFarmingSource = "Campaign" | "Onslaught" | "Both"
export type GoalStatus =
  "Draft" | "Active" | "Paused" | "Completed" | "Archived"
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

export type AscensionFarmingConfig = {
  source: AscensionFarmingSource
  shardBattleIds: string[]
  mythicShardBattleIds: string[]
}

export type UpgradeItemTarget = {
  upgradeId: string
  quantity: number
}

export type UpgradeTarget = {
  targets: UpgradeItemTarget[]
}

/** Target level for a specific piece of equipment/relic gear (`GoalEntityType` `"Equipment"`
 * only). Uncosted — no gold/salvage/mythic-salvage farming engine exists in this app; "complete"
 * is simply the player's synced level for this equipment reaching `targetLevel`. */
export type EquipmentTarget = {
  targetLevel: number
}

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
  equipment: EquipmentTarget | null
}

export type GoalMilestone = {
  index: number
  kind: string
  targetState: string
  source: "calculated" | "user"
  status: string
  completedAt: string | null
}

export type GoalSnapshot = {
  createdAt: string
  initialRank: string | null
  initialProgression: string | null
  initialActiveAbilityLevel: number | null
  initialPassiveAbilityLevel: number | null
  initialUnlocked: boolean | null
  initialRequirement: GoalSnapshotResource[]
  initialInventoryContribution: GoalSnapshotResource[]
  originalEnergyTotal: number | null
  originalRaidsTotal: number | null
  originalEstimateDays: number | null
  originalEstimateDate: string | null
}

export type GoalSnapshotResource = {
  resourceId: string
  count: number
}

export type CreateGoalSnapshotRequest = Omit<GoalSnapshot, "createdAt">

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
  aggregateId: string | null
  // Lean milestone counts (not the full list — see GoalDetail.milestones for that) so a goals list can
  // show "M/N" without an N+1 detail fetch per row.
  milestonesTotal: number
  milestonesCompleted: number
  createdAt: string
  updatedAt: string
}

export type GoalDetail = GoalSummary & {
  config: GoalConfig
  milestones: GoalMilestone[]
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
  equipment?: EquipmentTarget | null
}

export type CreateGoalRequest = {
  entityType: string
  entityId: string
  goalType: string
  config: CreateGoalConfigRequest
  // Omitted/empty falls back to the caller's default project; otherwise the goal is added to every
  // listed project (a goal may belong to several projects at once).
  projectIds?: string[] | null
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
  // Same fallback/multi-project semantics as CreateGoalRequest.projectIds.
  projectIds?: string[] | null
  goals: CombinedGoalSpec[]
}
