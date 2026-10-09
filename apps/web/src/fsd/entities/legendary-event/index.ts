// Public API of the Legendary Event entity: lifecycle, the next-milestone lookup, objective labels,
// objective matching, the points model, synced progress, the read hooks, and the persisted plan
// (teams per lane: DTOs, API, query options, coverage, points and run helpers). Pages and features
// consume it only through this file.
export {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventCommon,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventLaneRecord,
  type LegendaryEventLifecycle,
  type LegendaryEventLifecycleState,
  type LegendaryEventObjective,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
  type LegendaryEventUnitFilter,
} from "./model/types"
export {
  LEGENDARY_EVENT_RUN_DURATION_MS,
  deriveLegendaryEventLifecycle,
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
export { useLegendaryEventCommon } from "./model/use-legendary-event-common"
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
  type LegendaryEventDepthSource,
  type LegendaryEventPlan,
  type LegendaryEventPlanConflictCode,
  type LegendaryEventPlanConflictDto,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventTeamRunDepth,
  type UpdatePlanRequestDto,
  type UpdateTeamOrderRequestDto,
  type UpdateTeamRequestDto,
} from "./model/plan.types"
export {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  getLegendaryEventPlan,
  updateLegendaryEventPlan,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
} from "./api/legendary-event-plan.api"
export { legendaryEventPlanQueries } from "./api/legendary-event-plan.queries"
export { currentLegendaryEventRun, teamDepthForRun } from "./lib/current-run"
export { derivedTeamCoverage, reconcileCoverage } from "./lib/team-coverage"
export { teamPointsPerBattle } from "./lib/team-points"
