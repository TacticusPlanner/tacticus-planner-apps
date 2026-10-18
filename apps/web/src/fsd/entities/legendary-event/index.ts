// Public API of the Legendary Event entity: lifecycle, the next-milestone lookup, objective labels,
// objective matching, the points model, synced progress, the read hooks, the persisted plan
// (teams per lane, run inputs and marks: DTOs, API, query options, the shared write queue,
// coverage, points and run helpers), the reward projection, and clear-depth estimates (unit
// power, the estimate calculation, calibration). Pages and features consume it only through
// this file.
export {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventBattle,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventLaneRecord,
  type LegendaryEventLifecycle,
  type LegendaryEventLifecycleState,
  type LegendaryEventObjective,
  type LegendaryEventProgress,
  type LegendaryEventRewards,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
  type LegendaryEventUnitFilter,
} from "./model/types"
export {
  LEGENDARY_EVENT_RUN_DURATION_MS,
  deriveLegendaryEventLifecycle,
  isLegendaryEventFinished,
  orderLegendaryEventsForHub,
  type LegendaryEventHubEntry,
  type LegendaryEventHubGroups,
} from "./lib/lifecycle"
export {
  nextPointsMilestone,
  type NextPointsMilestone,
} from "./lib/next-points-milestone"
export {
  defeatAllIcon,
  scoreIcon,
  type ObjectiveIcon as ObjectiveIconModel,
} from "./lib/objective-label"
export {
  isUnitAllowedOnLane,
  matchesObjectiveFilter,
  objectivesSatisfied,
} from "./lib/objective-match"
export {
  buildCrossLaneLeaderboard,
  buildLaneLeaderboard,
  crossLaneFigure,
  crossLaneTotal,
  filterLeaderboard,
  objectiveFilterKey,
  remainingLanePoints,
  sortCrossLaneLeaderboard,
  sortLeaderboard,
  unitLanePotential,
  type CrossLaneFigures,
  type CrossLaneLeaderboardRow,
  type LaneUnitPotential,
  type LeaderboardFigure,
  type LeaderboardFilter,
  type LeaderboardOwnership,
  type LeaderboardRow,
  type LeaderboardUnitRow,
} from "./lib/unit-potential"
export {
  buildLanePointsModel,
  type LaneBattlePoints,
  type LanePointsModel,
} from "./lib/lane-points-model"
export {
  buildSyncedLaneProgress,
  objectiveClearedCounts,
  objectiveClearedThrough,
  type BattleProgressView,
  type LaneProgressView,
} from "./lib/synced-lane-progress"
export { type ReadState } from "./model/use-read-state"
export { useMinuteNow } from "./model/use-minute-now"
export {
  useLegendaryEvents,
  type LegendaryEventsState,
} from "./model/use-legendary-events"
export {
  useLegendaryEvent,
  type LegendaryEventState,
} from "./model/use-legendary-event"
export { useLegendaryEventsProgress } from "./model/use-legendary-events-progress"
export { useLegendaryEventProgress } from "./model/use-legendary-event-progress"
export { useLegendaryEventBattles } from "./model/use-legendary-event-battles"
export {
  useClearEstimateConfig,
  type ClearEstimateConfigState,
} from "./model/use-clear-estimate-config"
export {
  useLegendaryEventRoster,
  useLegendaryEventUnits,
} from "./model/use-legendary-event-units"
export {
  useLegendaryEventSyncTimes,
  type LegendaryEventSyncTimes,
} from "./model/use-legendary-event-sync-times"
export {
  useLaneAllowedRule,
  useObjectiveLabel,
  type ObjectiveLabel,
} from "./model/use-objective-label"
export { ObjectiveIcon } from "./ui/objective-icon"
export {
  legendaryEventPlanConflictDetails,
  type CreateTeamRequestDto,
  type LegendaryEventAnnotation,
  type LegendaryEventAnnotationStatus,
  type LegendaryEventDepthSource,
  type LegendaryEventPlan,
  type LegendaryEventPlanConflictCode,
  type LegendaryEventPlanConflictDto,
  type LegendaryEventRun,
  type LegendaryEventRunInputs,
  type LegendaryEventRunInputValues,
  type LegendaryEventTeam,
  type LegendaryEventTeamRunDepth,
  type UpdateAnnotationsRequestDto,
  type UpdatePlanRequestDto,
  type UpdateRunInputsRequestDto,
  type UpdateTeamOrderRequestDto,
  type UpdateTeamRequestDto,
} from "./model/plan.types"
export {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  getLegendaryEventPlan,
  getLegendaryEventRunRecords,
  listLegendaryEventPlans,
  updateLegendaryEventAnnotations,
  updateLegendaryEventPlan,
  updateLegendaryEventRunInputs,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
} from "./api/legendary-event-plan.api"
export { legendaryEventPlanQueries } from "./api/legendary-event-plan.queries"
export {
  usePlanWriteQueue,
  type PlanMutationOutcome,
  type PlanPatch,
  type PlanWriteOperation,
  type PlanWriteQueue,
} from "./model/use-plan-write-queue"
export {
  EMPTY_RUN_INPUT_VALUES,
  MAX_CLOSE_SHARDS,
  runInputValues,
} from "./lib/run-inputs"
export {
  ASCENSION_STEP_PROGRESSION,
  ASCENSION_STEPS,
  BATTLE_POINTS_AVERAGE,
  BUNDLE_CURRENCY,
  MISSION_CURRENCY,
  PREMIUM_BONUS_CURRENCY,
  nextAscensionStep,
  projectRewards,
  unitNextAscensionStep,
  type AscensionGoal,
  type AscensionStep,
  type RewardProjection,
  type RewardProjectionInput,
} from "./lib/reward-projection"
export {
  applicableAnnotations,
  annotationCellKey,
} from "./lib/applicable-annotations"
export { currentLegendaryEventRun, teamDepthForRun } from "./lib/current-run"
export {
  legendaryEventHasProgress,
  resolveLegendaryEventRuns,
  resolveLegendaryEventRunsAt,
  type LegendaryEventRunResolution,
  type LegendaryEventRunResolutionInput,
} from "./lib/run-resolution"
export { derivedTeamCoverage } from "./lib/team-coverage"
export { teamPointsLeft } from "./lib/team-points"
export { MIN_TEAM_MEMBERS, isCompleteTeam } from "./lib/team-size"
export { type NamedTeam } from "./lib/team-display-name"
export { useTeamDisplayName } from "./model/use-team-display-name"
export {
  clearEstimateConfig,
  estimateClearDepth,
  laneBattlePowers,
  lockedMemberCount,
  teamClearEstimate,
  teamEffectiveDepth,
  teamEffectivePower,
  teamPower,
  unitClearEstimate,
  unitHordeMultiplier,
  unitEffectivePower,
  unitPower,
  type ClearEstimate,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./lib/clear-estimate"
export {
  calibratePowerRatio,
  calibrationPoint,
  summarizeCalibration,
  type CalibrationSample,
  type PowerRatioCalibration,
} from "./lib/calibrate-power-ratio"
export {
  previewRoster,
  type LegendaryEventGoalRef,
  type LegendaryEventGoalTarget,
  type PreviewRoster,
} from "./lib/goal-preview-roster"
export {
  laneReachablePoints,
  type LaneReach,
  type LaneReachablePoints,
} from "./lib/reachable-points"
export { type UpgradeStep } from "./lib/upgrade-steps"
export {
  laneUpgradeImpact,
  type ImpactTeam,
  type UpgradeImpact,
  type UpgradeImpactInput,
  type UpgradeImpactRow,
} from "./lib/upgrade-impact"
export {
  SUGGESTION_TEAM_SIZE,
  suggestLaneTeams,
  type TeamSuggestion,
  type TeamSuggestionsInput,
} from "./lib/team-suggestions"
export {
  impactTeams,
  teamReaches,
  type LaneEstimateInputs,
} from "./lib/lane-teams"
export {
  type LegendaryEventPlanList,
  type LegendaryEventRunRecord,
  type LegendaryEventRunRecordEncounter,
  type LegendaryEventRunRecordLanes,
  type LegendaryEventRunRecordTeam,
  type LegendaryEventRunRecords,
  type RosterSnapshot,
  type RosterSnapshotAbility,
  type RosterSnapshotCharacter,
  type RosterSnapshotMow,
} from "./model/run-record.types"
export { useLegendaryEventPlans } from "./model/use-legendary-event-plans"
export { useLegendaryEventRunRecords } from "./model/use-legendary-event-run-records"
export {
  buildMasterTable,
  filterMasterTableRows,
  sortMasterTable,
  type MasterTable,
  type MasterTableCell,
  type MasterTableEventInput,
  type MasterTableInput,
  type MasterTableLaneCell,
  type MasterTablePointsMode,
  type MasterTableRow,
  type MasterTableUnitSet,
} from "./lib/master-table"
export {
  previousRunTeamClears,
  recordHistory,
  recordLaneSummary,
  recordTeamClearedBattle,
  rosterDeltas,
  selectRunRecords,
  type RecordLaneSummary,
  type RosterDelta,
  type RunHistory,
  type RunHistoryDeltas,
  type RunHistoryLane,
  type RunHistoryTeam,
  type RunRecordSelection,
} from "./lib/run-history"
export {
  UNTIERED_MULTIPLIER,
  buildHordeTierList,
  effectiveHordeMultiplier,
  hordeTierName,
  type HordeModeTierList,
  type HordeTierAlliance,
  type HordeTierList,
  type HordeTierListFilters,
  type HordeTierRow,
  type HordeTierTile,
} from "./lib/horde-tier-list"
export { useLegendaryEventsBattles } from "./model/use-legendary-events-battles"
export {
  battleEnemyCount,
  defaultBattleIndex,
  orderLaneBattles,
  sortedWaves,
} from "./lib/battle-preview"
export { useHordeModeTiers } from "./model/use-horde-mode-tiers"
export { tierToneClass } from "./lib/tier-tone"
