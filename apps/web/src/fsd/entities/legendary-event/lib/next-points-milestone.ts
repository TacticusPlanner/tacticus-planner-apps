import type { LegendaryEventCommon } from "../model/types"

export interface NextPointsMilestone {
  milestone: number
  cumulativePoints: number
  /** Event currency granted on reaching the milestone. */
  engramPayout: number
  /** Points still needed: `cumulativePoints - points`. */
  pointsToGo: number
}

/**
 * The first points milestone above `points` (the ladder is ordered by `cumulativePoints`
 * ascending), or `undefined` past the last milestone or without a reward ladder.
 */
export function nextPointsMilestone(
  common: Pick<LegendaryEventCommon, "pointsMilestones"> | null | undefined,
  points: number
): NextPointsMilestone | undefined {
  const next = common?.pointsMilestones.find(
    (milestone) => milestone.cumulativePoints > points
  )
  return next
    ? {
        milestone: next.milestone,
        cumulativePoints: next.cumulativePoints,
        engramPayout: next.engramPayout,
        pointsToGo: next.cumulativePoints - points,
      }
    : undefined
}
