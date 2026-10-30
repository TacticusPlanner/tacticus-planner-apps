// Public API of the Legendary Event entity: types, the read hooks, the persisted plan (DTOs, API,
// query options, the shared write queue), lifecycle, missions, run inputs, the points model, and
// the shared domain calculations (clear estimates, leaderboards, master table, tier list). Only
// what another slice imports is exported; pages and features consume it only through this file.
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
} from "./model/types"
export {
  LEGENDARY_EVENT_RUN_COUNT,
  LEGENDARY_EVENT_RUN_DURATION_MS,
  deriveLegendaryEventLifecycle,
  orderLegendaryEventsForHub,
  type LegendaryEventSchedule,
} from "./lib/lifecycle"
export {
  defeatAllIcon,
  type ObjectiveIcon as ObjectiveIconModel,
} from "./lib/objective-label"
export { unitDealtDamageTypes } from "./lib/damage-profile-exclusions"
export { objectivesSatisfied } from "./lib/objective-match"
export {
  buildCrossLaneLeaderboard,
  buildLaneLeaderboard,
  crossLaneFigure,
  filterLeaderboard,
  objectiveFilterKey,
  remainingLanePoints,
  sortCrossLaneLeaderboard,
  sortLeaderboard,
  unitLanePotential,
  type CrossLaneLeaderboardRow,
  type LeaderboardFigure,
  type LeaderboardOwnership,
  type LeaderboardRow,
  type LeaderboardUnitRow,
} from "./lib/unit-potential"
export {
  buildLanePointsModel,
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
export { useLegendaryEvents } from "./model/use-legendary-events"
export { useMinuteNow } from "./model/use-minute-now"
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
export { useLegendaryEventSyncTimes } from "./model/use-legendary-event-sync-times"
export {
  useLaneAllowedRule,
  useObjectiveLabel,
} from "./model/use-objective-label"
export { ObjectiveIcon } from "./ui/objective-icon"
export {
  type CreateTeamRequestDto,
  type LegendaryEventAnnotation,
  type LegendaryEventAnnotationStatus,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventRunInputs,
  type LegendaryEventRunInputValues,
  type LegendaryEventTeam,
  type UpdateTeamRequestDto,
} from "./model/plan.types"
export {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
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
} from "./model/use-plan-write-queue"
export {
  EMPTY_RUN_INPUT_VALUES,
  MAX_CLOSE_SHARDS,
  runInputValues,
} from "./lib/run-inputs"
export {
  UNTRACKED_MISSION_KINDS,
  battleEnemies,
  eventMissions,
  openMissions,
  tokenProgressesMission,
  type BattleEnemies,
  type LegendaryEventMission,
  type LegendaryEventMissionRef,
  type LegendaryEventMissionTrack,
} from "./lib/missions"
export { useMissionLabel } from "./model/use-mission-label"
export {
  ASCENSION_STEPS,
  BUNDLE_CURRENCY,
  MISSION_CURRENCY,
  PREMIUM_BONUS_CURRENCY,
  nextAscensionStep,
  projectRewards,
  unitNextAscensionStep,
  type AscensionGoal,
  type AscensionStep,
  type RewardProjection,
} from "./lib/reward-projection"
export {
  applicableAnnotations,
  annotationCellKey,
} from "./lib/applicable-annotations"
export { currentLegendaryEventRun, teamDepthForRun } from "./lib/current-run"
export {
  resolveLegendaryEventRunsAt,
  type LegendaryEventRunResolution,
} from "./lib/run-resolution"
export { derivedTeamCoverage } from "./lib/team-coverage"
export {
  MAX_TEAMS_PER_LANE,
  MIN_TEAM_MEMBERS,
  isCompleteTeam,
} from "./lib/team-size"
export { type NamedTeam } from "./lib/team-display-name"
export { useTeamDisplayName } from "./model/use-team-display-name"
export {
  laneBattlePowers,
  teamClearEstimate,
  teamEffectiveDepth,
  teamPower,
  unitClearEstimate,
  unitHordeMultiplier,
  unitEffectivePower,
  type ClearEstimate,
  type ClearEstimateConfig,
  type ClearEstimateRoster,
} from "./lib/clear-estimate"
export {
  previewRoster,
  type LegendaryEventGoalRef,
  type LegendaryEventGoalTarget,
} from "./lib/goal-preview-roster"
export { laneReachablePoints, type LaneReach } from "./lib/reachable-points"
export { nextUpgradeSteps, type UpgradeStep } from "./lib/upgrade-steps"
export {
  laneUpgradeImpact,
  type UpgradeImpact,
  type UpgradeImpactRow,
} from "./lib/upgrade-impact"
export { suggestLaneTeams, type TeamSuggestion } from "./lib/team-suggestions"
export {
  laneRosterPotential,
  potentialCellStates,
  type LaneRosterPotential,
  type PotentialCellState,
} from "./lib/roster-potential"
export {
  impactTeams,
  teamReaches,
  type LaneEstimateInputs,
} from "./lib/lane-teams"
export {
  type LegendaryEventRunRecord,
  type LegendaryEventRunRecordEncounter,
  type LegendaryEventRunRecordTeam,
  type RosterSnapshot,
} from "./model/run-record.types"
export { useLegendaryEventPlans } from "./model/use-legendary-event-plans"
export { useLegendaryEventRunRecords } from "./model/use-legendary-event-run-records"
export { useLegendaryEventRunRecordRosters } from "./model/use-legendary-event-run-record-roster"
export {
  buildMasterTable,
  filterMasterTableRows,
  sortMasterTable,
  type MasterTableCell,
  type MasterTableEventInput,
  type MasterTablePointsMode,
  type MasterTableRow,
  type MasterTableUnitSet,
} from "./lib/master-table"
export {
  UNTIERED_MULTIPLIER,
  buildHordeTierList,
  type HordeModeTierList,
  type HordeRelicRating,
  type HordeTierAlliance,
  type HordeTierList,
} from "./lib/horde-tier-list"
export { useLegendaryEventsBattles } from "./model/use-legendary-events-battles"
export { useHordeModeTiers } from "./model/use-horde-mode-tiers"
export { tierToneClass } from "./lib/tier-tone"
