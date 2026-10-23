import {
  laneReachablePoints,
  type LanePointsModel,
  type LaneProgressView,
  type LaneReach,
} from "@/entities/legendary-event"

/**
 * The points a team alone can still earn over battles 1..its depth (spec: a team card shows the
 * points it has left within its depth): the lane reachable points of that one reach, net of the
 * synced progress. Other teams are not deducted.
 */
export function teamPointsLeft(
  model: LanePointsModel,
  progress: LaneProgressView | undefined,
  reach: LaneReach
): number {
  return laneReachablePoints(model, progress, [reach]).total
}
