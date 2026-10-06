import type { LegendaryEventLaneRecord } from "../model/types"
import type { LanePointsModel } from "./lane-points-model"

export interface BattleProgressView {
  /** 0-based battle index. */
  index: number
  /** Defeat-all first, then one flag per objective in catalog `index` order. */
  cleared: boolean[]
  /** The synced `encounterPoints`, never recomputed from the cleared flags. */
  pointsEarned: number
  maxPoints: number
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
  /** Σ `encounterPoints` over the lane's battles. */
  pointsEarned: number
  maxPoints: number
}

/**
 * Maps a synced lane record onto the lane's points model (spec: synced lane data maps onto battles
 * and objectives): `encounters[i]` is battle `i`; in `objectivesCleared` id 0 is defeat-all and id
 * `k` is the objective with catalog `index` `k − 1`. `laneRecord` is `null` for a null lane and
 * `undefined` when the event has no synced entry.
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
    return {
      index: battle.index,
      cleared,
      pointsEarned: encounter?.encounterPoints ?? 0,
      maxPoints: battle.maxPoints,
      highScore: encounter?.highScore ?? 0,
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
  }
}
