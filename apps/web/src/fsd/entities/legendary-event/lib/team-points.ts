import type { LegendaryEventLane } from "../model/types"

/**
 * A team's points per battle (design D4): the lane's kill points plus the points of each covered
 * objective — the figure the leaderboard shows per unit for the same objectives.
 */
export function teamPointsPerBattle(
  lane: Pick<LegendaryEventLane, "killPoints" | "unitsRestrictions">,
  objectiveIndexes: readonly number[]
): number {
  const covered = new Set(objectiveIndexes)
  return lane.unitsRestrictions
    .filter((objective) => covered.has(objective.index))
    .reduce((sum, objective) => sum + objective.points, lane.killPoints)
}
