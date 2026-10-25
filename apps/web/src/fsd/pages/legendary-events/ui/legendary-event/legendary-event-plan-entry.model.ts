import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

/** Teams a lane needs before the event counts as planned. */
const PLANNED_TEAMS_PER_LANE = 2

/** Whether the event already has a plan to refine: a linked project and at least two teams in
 *  every lane. Unknown teams or projects (loading, failed) count as not planned. */
export function hasEventPlan(
  teams: readonly { laneId: LegendaryEventLaneId }[] | undefined,
  projectCount: number | undefined
): boolean {
  if (!teams || !projectCount) return false
  return LEGENDARY_EVENT_LANE_IDS.every(
    (laneId) =>
      teams.filter((team) => team.laneId === laneId).length >=
      PLANNED_TEAMS_PER_LANE
  )
}
