import {
  maxRankForProgression,
  rankOrder,
  rarityOrder,
  rarityRank,
  startingProgression,
} from "@workspace/game-domain"
import type { Rank, Rarity } from "@workspace/game-domain"

import type { GuildWarEnemy, GuildWarEnemyUnit } from "./types"

/** The enemy details as the dialog edits them; empty means none were entered. */
export interface EnemyDraft {
  characters: GuildWarEnemyUnit[]
  mow: GuildWarEnemyUnit | null
  buffIds: string[]
  boardId: string | null
}

export const EMPTY_ENEMY: EnemyDraft = {
  characters: [],
  mow: null,
  buffIds: [],
  boardId: null,
}

/** The most enemy characters one lineup holds. */
export const MAX_ENEMY_CHARACTERS = 5

/**
 * An enemy unit as it is added: at the defenders' rarity and, for a character, the highest rank that
 * rarity allows (defenders are capped there, and most are at it), and killed. A Machine of War is
 * never killed, so it has no outcome.
 */
export function enemyUnit(
  unitId: string,
  kind: "character" | "mow",
  defenderRarity: Rarity | undefined
): GuildWarEnemyUnit {
  return {
    unitId,
    rarity: defenderRarity ?? null,
    rank:
      kind === "character" && defenderRarity
        ? maxRankForProgression(startingProgression(defenderRarity))
        : null,
    state: kind === "character" ? "killed" : null,
  }
}

/** The highest rank a unit at a rarity can have: that rarity's rank cap. */
function rarityMaxRank(rarity: Rarity): Rank {
  return maxRankForProgression(startingProgression(rarity))
}

/** The rarities an enemy can be noted at: none above the defenders' cap (all without one). */
export function enemyRarities(cap: Rarity | undefined): readonly Rarity[] {
  return cap
    ? rarityOrder.filter((rarity) => rarityRank(rarity) <= rarityRank(cap))
    : rarityOrder
}

/** The ranks an enemy can be noted at: none above the cap of the defenders' rarity, nor of the
 *  enemy's own noted rarity when it is lower. */
export function enemyRanks(
  cap: Rarity | undefined,
  rarity: Rarity | null
): readonly Rank[] {
  const limits = [cap, rarity ?? undefined].filter(
    (entry): entry is Rarity => entry !== undefined
  )
  const top = Math.min(
    ...limits.map((entry) => rankOrder.indexOf(rarityMaxRank(entry))),
    rankOrder.length - 1
  )
  return rankOrder.slice(0, top + 1)
}

/** An enemy unit brought within the defenders' cap: a rarity above it drops to it, and a rank
 *  above what the cap and its rarity allow drops to the highest they do. */
function capEnemyUnit(unit: GuildWarEnemyUnit, cap: Rarity): GuildWarEnemyUnit {
  const rarity =
    unit.rarity && rarityRank(unit.rarity) > rarityRank(cap) ? cap : unit.rarity
  if (!unit.rank) return { ...unit, rarity }
  const ranks = enemyRanks(cap, rarity)
  const allowed = ranks.some((rank) => rank === unit.rank)
  return { ...unit, rarity, rank: allowed ? unit.rank : (ranks.at(-1) ?? null) }
}

/** The enemy details within the defenders' cap, so lowering the cap in the dialog lowers the noted
 *  enemies with it. Unchanged without a cap. */
export function capEnemy(
  draft: EnemyDraft,
  cap: Rarity | undefined
): EnemyDraft {
  if (!cap) return draft
  return {
    ...draft,
    characters: draft.characters.map((unit) => capEnemyUnit(unit, cap)),
    mow: draft.mow && capEnemyUnit(draft.mow, cap),
  }
}

/** The enemy an attack was logged with, as the dialog edits it. */
export function enemyDraft(enemy: GuildWarEnemy | null): EnemyDraft {
  return enemy
    ? {
        characters: [...enemy.characters],
        mow: enemy.mow,
        buffIds: [...enemy.buffIds],
        boardId: enemy.boardId,
      }
    : EMPTY_ENEMY
}

/** The draft as the API takes it: null when nothing was entered. */
export function enemyFields(draft: EnemyDraft): GuildWarEnemy | null {
  const empty =
    draft.characters.length === 0 &&
    draft.mow === null &&
    draft.buffIds.length === 0 &&
    draft.boardId === null
  if (empty) return null
  // A Machine of War has no outcome; an older attack may still store one.
  return { ...draft, mow: draft.mow && { ...draft.mow, state: null } }
}
