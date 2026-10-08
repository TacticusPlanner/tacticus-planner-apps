import type { LegendaryEventLaneId } from "@/entities/legendary-event"

/** The stable id of a lane's progress heading, the Overview lane summary's scroll target. */
export function progressHeadingId(laneId: LegendaryEventLaneId): string {
  return `legendary-event-progress-${laneId}`
}
