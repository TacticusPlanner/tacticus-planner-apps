import type { LegendaryEventLaneRecord } from "../model/types"
import type { LanePointsModel } from "./lane-points-model"

export interface BattleProgressView {
  /** 0-based battle index. */
  index: number
  /** Defeat-all first, then one flag per objective in catalog `index` order. */
  cleared: boolean[]
  /** How many of `cleared` are true (defeat-all included). */
  clearedCount: number
  /**
   * `killScore` + `highScore` + the defeat-all score when cleared + Σ cleared objective scores: a
   * fully cleared battle at full scores equals `maxPoints`.
   */
  pointsEarned: number
  maxPoints: number
  /** The kill score award: synced `encounterPoints`, at most `battlePoints`; 0 without an
   *  encounter. */
  killScore: number
  /** The high score award: synced `highScore`, at most `battlePoints`; 0 without an encounter. */
  highScore: number
  /** Every expected objective id (0 through the objective count) is cleared. */
  complete: boolean
}

export interface LaneProgressView {
  /**
   * `synced`: the lane has a record; `noLane`: the event's entry has this lane as `null`;
   * `noEvent`: the synced `lre-progress` has no entry for the event.
   */
  status: "synced" | "noLane" | "noEvent"
  battles: BattleProgressView[]
  /** Σ battle earned points. */
  pointsEarned: number
  maxPoints: number
  /** How many battles are complete. */
  completeBattles: number
}

/**
 * Maps a synced lane record onto the lane's points model (spec: synced lane data maps onto battles
 * and objectives): `encounters[i]` is battle `i`; in `objectivesCleared` id 0 is defeat-all and id
 * `k` is the objective with catalog `index` `k − 1`. A battle awards its kill score
 * (`encounterPoints`) and its high score (`highScore`) separately, each capped at `battlesPoints[i]`.
 * `laneRecord` is `null` for a null lane and `undefined` when the event has no synced entry.
 */
export function buildSyncedLaneProgress(
  model: LanePointsModel,
  laneRecord: LegendaryEventLaneRecord | null | undefined
): LaneProgressView {
  const columns = model.objectives.length + 1
  const encounters = laneRecord?.encounters ?? []

  const battles = model.battles.map((battle): BattleProgressView => {
    const encounter = encounters[battle.index]
    const clearedIds = new Set(encounter?.objectivesCleared ?? [])
    const cleared = Array.from({ length: columns }, (_, id) =>
      clearedIds.has(id)
    )
    const cap = (score: number | undefined) =>
      Math.min(Math.max(0, score ?? 0), battle.battlePoints)
    const killScore = cap(encounter?.encounterPoints)
    const highScore = cap(encounter?.highScore)
    const clearedScores = cleared.reduce(
      (sum, isCleared, id) =>
        isCleared
          ? sum +
            (id === 0
              ? battle.defeatAllPoints
              : (battle.objectiveScores[id - 1] ?? 0))
          : sum,
      0
    )
    return {
      index: battle.index,
      cleared,
      clearedCount: cleared.filter(Boolean).length,
      pointsEarned: killScore + highScore + clearedScores,
      maxPoints: battle.maxPoints,
      killScore,
      highScore,
      complete: cleared.every(Boolean),
    }
  })

  return {
    status:
      laneRecord === undefined
        ? "noEvent"
        : laneRecord === null
          ? "noLane"
          : "synced",
    battles,
    pointsEarned: battles.reduce((sum, battle) => sum + battle.pointsEarned, 0),
    maxPoints: model.maxPoints,
    completeBattles: battles.filter((battle) => battle.complete).length,
  }
}

/**
 * How many of the lane's battles have each objective cleared, in catalog `index` order (spec: the
 * Overview lane summary objectives line and the objective chips' counts). `objectiveCount` is the
 * lane's objective count; a `noLane` or `noEvent` lane yields zeros.
 */
export function objectiveClearedCounts(
  progress: Pick<LaneProgressView, "battles">,
  objectiveCount: number
): number[] {
  return Array.from({ length: objectiveCount }, (_, objective) =>
    progress.battles.reduce(
      (count, battle) => count + (battle.cleared[objective + 1] ? 1 : 0),
      0
    )
  )
}
