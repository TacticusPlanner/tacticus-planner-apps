// Public API of the Legendary Event entity: lifecycle, the next-milestone lookup, objective labels
// and the read hooks. Pages consume it only through this file.
export {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventCommon,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventLifecycleState,
  type LegendaryEventObjective,
  type LegendaryEventProgress,
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
export type { ObjectiveIcon as ObjectiveIconModel } from "./lib/objective-label"
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
  useLaneAllowedRule,
  useObjectiveLabel,
  type ObjectiveLabel,
} from "./model/use-objective-label"
export { ObjectiveIcon } from "./ui/objective-icon"
