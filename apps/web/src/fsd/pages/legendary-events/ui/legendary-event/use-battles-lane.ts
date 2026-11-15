import { startTransition, useCallback } from "react"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { usePersistedSelection } from "@/shared/lib"

const BATTLES_LANE_KEY = "legendaryEvents.plan.battlesLane"

const isLane = (value: unknown): value is LegendaryEventLaneId =>
  (LEGENDARY_EVENT_LANE_IDS as readonly unknown[]).includes(value)

/** Plan's Battles lane (one lane at a time, picked in the battle row), remembered per browser.
 *  Picking one is a transition: the lane's Battles section is rebuilt after the pick repaints. */
export function useBattlesLane(): [
  LegendaryEventLaneId,
  (lane: LegendaryEventLaneId) => void,
] {
  const [lane, setLane] = usePersistedSelection(
    BATTLES_LANE_KEY,
    isLane,
    "alpha"
  )
  const pick = useCallback(
    (next: LegendaryEventLaneId) => startTransition(() => setLane(next)),
    [setLane]
  )
  return [lane, pick]
}
