import type { LanePointsModel } from "./lane-points-model"
import { laneReachablePoints, type LaneReach } from "./reachable-points"
import type { LaneProgressView } from "./synced-lane-progress"

/** Fewest of `masks` whose union includes `target` (an exact cover over a few bits). */
function fewestCovering(masks: readonly number[], target: number): number {
  if (target === 0) return 0
  const fewest = Array.from({ length: target + 1 }, () => Infinity)
  fewest[0] = 0
  for (let mask = 0; mask <= target; mask++) {
    const count = fewest[mask]!
    if (count === Infinity || (mask & target) !== mask) continue
    for (const team of masks) {
      const next = (mask | team) & target
      if (count + 1 < fewest[next]!) fewest[next] = count + 1
    }
  }
  return fewest[target]!
}

/**
 * The fewest tokens a lane's teams need to earn every point they can still reach (spec: tokens
 * saved): per battle with points left for a reaching team, the fewest reaching teams that
 * together cover each uncleared objective any reaching team covers, and at least one token.
 * `progress` undefined means nothing is cleared.
 */
export function laneTokensNeeded(
  model: LanePointsModel,
  progress: LaneProgressView | undefined,
  reaches: readonly LaneReach[]
): number {
  const { perBattle } = laneReachablePoints(model, progress, reaches)
  const bitOf = new Map(
    model.objectives.map((objective, column) => [objective.index, 1 << column])
  )
  const maskOf = (reach: LaneReach) =>
    reach.coveredObjectiveIndexes.reduce(
      (mask, index) => mask | (bitOf.get(index) ?? 0),
      0
    )
  return model.battles.reduce((total, battle) => {
    if ((perBattle[battle.index] ?? 0) <= 0) return total
    const cleared = progress?.battles[battle.index]?.cleared ?? []
    const open = model.objectives.reduce(
      (mask, _objective, column) =>
        cleared[column + 1] ? mask : mask | (1 << column),
      0
    )
    const masks = reaches
      .filter((reach) => reach.depth > battle.index)
      .map((reach) => maskOf(reach) & open)
    const target = masks.reduce((all, mask) => all | mask, 0)
    return total + Math.max(1, fewestCovering(masks, target))
  }, 0)
}
