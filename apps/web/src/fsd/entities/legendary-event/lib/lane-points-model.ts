import type {
  LegendaryEventLane,
  LegendaryEventObjective,
} from "../model/types"

export interface LaneBattlePoints {
  /** 0-based battle index, in `battleIds` order. */
  index: number
  /** `battlesPoints[i]`: awarded up to once as kill score and once as high score. */
  battlePoints: number
  /** `defeatAll[i]`: the defeat-all objective's score. */
  defeatAllPoints: number
  /** The five objective scores, in catalog `index` order. */
  objectiveScores: number[]
  /** Kill score + high score + defeat-all + Σ objective scores. */
  maxPoints: number
}

export interface LanePointsModel {
  /** The lane's objectives in catalog `index` order (the grid's columns after defeat-all). */
  objectives: LegendaryEventObjective[]
  battles: LaneBattlePoints[]
  /** Σ per-battle maximum. */
  maxPoints: number
}

/**
 * The canonical points model of a lane (spec: canonical lane points model). Every lane, event, hub
 * and Home total derives from this one model.
 */
export function buildLanePointsModel(
  lane: Pick<
    LegendaryEventLane,
    "battleIds" | "battlesPoints" | "defeatAll" | "unitsRestrictions"
  >
): LanePointsModel {
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )
  const objectiveScores = objectives.map((objective) => objective.points)
  const objectivesTotal = objectiveScores.reduce((sum, score) => sum + score, 0)
  const count = Math.max(lane.battleIds.length, lane.battlesPoints.length)

  const battles = Array.from({ length: count }, (_, index) => {
    const battlePoints = lane.battlesPoints[index] ?? 0
    const defeatAllPoints = lane.defeatAll[index] ?? 0
    return {
      index,
      battlePoints,
      defeatAllPoints,
      objectiveScores,
      maxPoints: battlePoints * 2 + defeatAllPoints + objectivesTotal,
    }
  })
  return {
    objectives,
    battles,
    maxPoints: battles.reduce((sum, battle) => sum + battle.maxPoints, 0),
  }
}
