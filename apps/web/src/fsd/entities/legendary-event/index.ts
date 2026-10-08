// Public API of the Legendary Event entity: lifecycle, the next-milestone lookup, objective labels,
// objective matching, the points model, synced progress and the read hooks. Pages consume it only
// through this file.
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
