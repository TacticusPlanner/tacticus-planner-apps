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

export const enemyUnit = (unitId: string): GuildWarEnemyUnit => ({
  unitId,
  rarity: null,
  rank: null,
  state: null,
})

/** The draft as the API takes it: null when nothing was entered. */
export function enemyFields(draft: EnemyDraft): GuildWarEnemy | null {
  const empty =
    draft.characters.length === 0 &&
    draft.mow === null &&
    draft.buffIds.length === 0 &&
    draft.boardId === null
  return empty ? null : draft
}
