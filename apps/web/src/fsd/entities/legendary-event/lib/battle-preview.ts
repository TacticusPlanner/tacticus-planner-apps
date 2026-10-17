import type { LegendaryEventBattle } from "../model/types"
import type {
  BattleProgressView,
  LaneProgressView,
} from "./synced-lane-progress"

/**
 * The battle a lane's preview opens on (0-based): the first battle not complete in synced
 * progress, the first battle without synced progress, the last one when every battle is complete.
 */
export function defaultBattleIndex(
  progress:
    | {
        status: LaneProgressView["status"]
        battles: readonly Pick<BattleProgressView, "complete">[]
      }
    | undefined,
  battleCount: number
): number {
  if (battleCount <= 0) return 0
  if (!progress || progress.status !== "synced") return 0
  const next = progress.battles.findIndex((battle) => !battle.complete)
  return next === -1 ? battleCount - 1 : Math.min(next, battleCount - 1)
}

/** A lane's battles in the order of its catalog `battleIds`; ids with no served battle are skipped. */
export function orderLaneBattles(
  battleIds: readonly string[],
  battles: readonly LegendaryEventBattle[]
): LegendaryEventBattle[] {
  const byId = new Map(battles.map((battle) => [battle.id, battle]))
  return battleIds.flatMap((id) => {
    const battle = byId.get(id)
    return battle ? [battle] : []
  })
}

/** A battle's waves by round, earliest first (served order is kept for equal rounds). */
export function sortedWaves(
  battle: Pick<LegendaryEventBattle, "waves">
): LegendaryEventBattle["waves"] {
  return [...battle.waves].sort((a, b) => a.round - b.round)
}

/** Every enemy the battle spawns: Σ `count` over every enemy of every wave. */
export function battleEnemyCount(
  battle: Pick<LegendaryEventBattle, "waves">
): number {
  return battle.waves.reduce(
    (total, wave) =>
      total + wave.enemies.reduce((sum, enemy) => sum + enemy.count, 0),
    0
  )
}
