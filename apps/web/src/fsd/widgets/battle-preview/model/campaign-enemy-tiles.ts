import { isRank, rankIndex } from "@workspace/game-domain"

import {
  buildEnemyTile,
  type EnemyNpcs,
  type EnemyTileViewModel,
} from "./enemy-tile"

/** A campaign battle's served enemy entry: an NPC at a rank and stars, `count` times. */
export interface CampaignEnemy {
  id: string
  count: number
  rank: string
  stars: number
}

// Past every ladder, so `resolveLadderRow` reads it as "level unknown" instead of a wrong row.
const UNKNOWN_LADDER_INDEX = Number.MAX_SAFE_INTEGER

/**
 * A campaign battle's enemies as tiles, in served order. Campaign battles name each enemy's rank and
 * stars rather than a ladder position, so the level is the NPC's first ladder row at that rank (the
 * dataset's 0-based rank index) and stars; an enemy whose ladder has no such row shows "level
 * unknown" (never guessed).
 */
export function campaignEnemyTiles(
  enemies: readonly CampaignEnemy[],
  npcsById: EnemyNpcs
): EnemyTileViewModel[] {
  return enemies.map((enemy, index) =>
    buildEnemyTile(
      {
        id: enemy.id,
        count: enemy.count,
        ladderIndex: ladderIndexOf(enemy, npcsById),
      },
      `enemy-${index}`,
      npcsById
    )
  )
}

function ladderIndexOf(enemy: CampaignEnemy, npcsById: EnemyNpcs): number {
  if (typeof npcsById === "string" || !isRank(enemy.rank)) {
    return UNKNOWN_LADDER_INDEX
  }
  const rank = rankIndex(enemy.rank)
  const servedIndex =
    npcsById
      .get(enemy.id)
      ?.stats.findIndex(
        (row) => row.rank === rank && row.stars === enemy.stars
      ) ?? -1
  return servedIndex === -1 ? UNKNOWN_LADDER_INDEX : servedIndex + 1
}
