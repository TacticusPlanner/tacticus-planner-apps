import type {
  LaneProgressView,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

/** The battle a token's battle button asked for (0-based index in its lane). */
export interface BattleInfoTarget {
  laneId: LegendaryEventLaneId
  battleIndex: number
}

/** The lane's first battle that isn't fully cleared (0-based), the first battle without synced
 *  progress, the last one when every battle is cleared. */
export function firstOpenBattleIndex(
  progress: Pick<LaneProgressView, "battles"> | undefined
): number {
  const battles = progress?.battles ?? []
  const open = battles.find((battle) => !battle.complete)
  return open ? open.index : Math.max(0, battles.length - 1)
}

/** The previous (`step` −1) or next (+1) battle of the lane, null past either end. */
export function adjacentBattle(
  target: BattleInfoTarget,
  battleCount: number,
  step: -1 | 1
): BattleInfoTarget | null {
  const battleIndex = target.battleIndex + step
  return battleIndex < 0 || battleIndex >= battleCount
    ? null
    : { laneId: target.laneId, battleIndex }
}
