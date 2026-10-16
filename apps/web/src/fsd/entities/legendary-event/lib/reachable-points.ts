import type { LanePointsModel } from "./lane-points-model"
import type { LaneProgressView } from "./synced-lane-progress"

/** How far one team gets and which objectives it scores there (design D4). */
export interface LaneReach {
  /** Battles 1..depth; 0 reaches none. */
  depth: number
  /** Catalog `index` of each objective the team scores (stored and still derived). */
  coveredObjectiveIndexes: readonly number[]
}

export interface LaneReachablePoints {
  total: number
  /** One figure per battle, in battle order; 0 for a battle no team reaches. */
  perBattle: number[]
}

/**
 * The event points a lane's teams can still earn within their depths (spec: lane reachable points):
 * per battle some team reaches, the kill score left (`battlesPoints − killScore`, not below 0), the
 * high score left (`battlesPoints − highScore`, not below 0), the defeat-all score unless cleared,
 * and each uncleared objective a reaching team covers. Marks are not read. `progress` undefined
 * means nothing is cleared.
 */
export function laneReachablePoints(
  model: LanePointsModel,
  progress: LaneProgressView | undefined,
  reaches: readonly LaneReach[]
): LaneReachablePoints {
  const perBattle = model.battles.map((battle) => {
    const reaching = reaches.filter((reach) => reach.depth > battle.index)
    if (reaching.length === 0) return 0
    const synced = progress?.battles[battle.index]
    const cleared = synced?.cleared ?? []
    const killScore = synced?.killScore ?? 0
    const highScore = synced?.highScore ?? 0
    const covered = new Set(
      reaching.flatMap((reach) => reach.coveredObjectiveIndexes)
    )
    let points =
      Math.max(0, battle.battlePoints - killScore) +
      Math.max(0, battle.battlePoints - highScore)
    if (!cleared[0]) points += battle.defeatAllPoints
    for (const [column, objective] of model.objectives.entries()) {
      if (covered.has(objective.index) && !cleared[column + 1]) {
        points += objective.points
      }
    }
    return points
  })
  return {
    total: perBattle.reduce((sum, points) => sum + points, 0),
    perBattle,
  }
}
