import {
  npcLibraryHref,
  resolveLadderRow,
  type NpcRecord,
  type NpcStatRow,
} from "@/entities/npc"

/** One served enemy entry of a battle or wave: an NPC at a ladder index, `count` times. */
export interface EnemyTileViewModel {
  key: string
  npcId: string
  /** The served NPC, or undefined while `npcs` is pending or failed, or when the id is unknown. */
  npc: NpcRecord | undefined
  count: number
  /** The resolved ladder row; undefined when the level is unknown (or NPCs are pending). */
  row: NpcStatRow | undefined
  /** The NPC Library page at this variation and level, when the Library lists the variation. */
  libraryHref: string | undefined
  /** `pending`: NPCs not read yet; `unavailable`: the NPC read failed; `unknownLevel`: unknown id or
   *  an index past the ladder. */
  level: "resolved" | "unknownLevel" | "pending" | "unavailable"
}

/** The `npcs` read as the tiles need it: the id map once read, else why it is missing. */
export type EnemyNpcs =
  ReadonlyMap<string, NpcRecord> | "pending" | "unavailable"

/** A served `{ id, ladderIndex, count }` entry as a tile. Levels resolve through `resolveLadderRow`
 *  (1-based `ladderIndex`). */
export function buildEnemyTile(
  enemy: { id: string; ladderIndex: number; count: number },
  key: string,
  npcsById: EnemyNpcs
): EnemyTileViewModel {
  if (typeof npcsById === "string") {
    return {
      key,
      npcId: enemy.id,
      npc: undefined,
      count: enemy.count,
      row: undefined,
      libraryHref: undefined,
      level: npcsById,
    }
  }
  const npc = npcsById.get(enemy.id)
  const resolved = resolveLadderRow(npc, enemy.ladderIndex)
  return {
    key,
    npcId: enemy.id,
    npc,
    count: enemy.count,
    row: resolved?.row,
    libraryHref:
      npc && resolved ? npcLibraryHref(npc, resolved.servedIndex) : undefined,
    level: resolved ? "resolved" : "unknownLevel",
  }
}
