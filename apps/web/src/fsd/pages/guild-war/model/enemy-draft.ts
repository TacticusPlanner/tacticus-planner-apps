import {
  maxRankForProgression,
  startingProgression,
} from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

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
