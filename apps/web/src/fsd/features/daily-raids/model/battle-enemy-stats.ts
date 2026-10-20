import { isRank, rankIndex } from "@workspace/game-domain"

/** What the enemy stats read of an npc record (the catalog `npcs` dataset). */
export type StatsNpc = {
  factionId: string
  stats: readonly { rank: number; stars: number; health: number }[]
}

export type StatsBattle = {
  detailedEnemyTypes: readonly {
    id: string
    count: number
    rank: string
    stars: number
  }[]
}

export type BattleEnemyStats = {
  /** Total health of the battle's enemies: the least damage a win deals. */
  health: number
  /** Enemy count per faction id. */
  byFaction: ReadonlyMap<string, number>
}

/**
 * A battle's enemies resolved through the `npcs` dataset: each enemy's health at its rank (the
 * dataset's 0-based rank index) and stars, times its count, and the enemies per faction. An enemy
 * the dataset cannot resolve, or a rank and stars its ladder lacks, adds no health and no faction
 * (never guessed).
 */
export function battleEnemyStats(
  battle: StatsBattle,
  npcsById: ReadonlyMap<string, StatsNpc>
): BattleEnemyStats {
  let health = 0
  const byFaction = new Map<string, number>()
  for (const enemy of battle.detailedEnemyTypes) {
    const npc = npcsById.get(enemy.id)
    if (!npc) continue
    byFaction.set(
      npc.factionId,
      (byFaction.get(npc.factionId) ?? 0) + enemy.count
    )
    if (!isRank(enemy.rank)) continue
    const rank = rankIndex(enemy.rank)
    const row = npc.stats.find(
      (stat) => stat.rank === rank && stat.stars === enemy.stars
    )
    health += (row?.health ?? 0) * enemy.count
  }
  return { health, byFaction }
}
