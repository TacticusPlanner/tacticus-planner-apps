import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { usePersistedSelection } from "@/shared/lib"

const BATTLES_LANE_KEY = "legendaryEvents.plan.battlesLane"

const isLane = (value: unknown): value is LegendaryEventLaneId =>
  (LEGENDARY_EVENT_LANE_IDS as readonly unknown[]).includes(value)

/** Plan's Battles lane (one lane at a time, picked in the battle row), remembered per browser. */
export function useBattlesLane() {
  return usePersistedSelection(BATTLES_LANE_KEY, isLane, "alpha")
}
