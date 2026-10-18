import type { NpcRecord, NpcStatRow } from "../model/types"

/** A ladder row picked by a 1-based index, with its 0-based served position. */
export interface ResolvedLadderRow {
  /** 0-based index into the served `stats` (the NPC Library's `?level=` value). */
  servedIndex: number
  row: NpcStatRow
}

/**
 * The stat row a Legendary Event wave enemy fights at: `ladderIndex` is the 1-based position in the
 * NPC's served ladder (V1's N in "{npcId}:{N}"), not a star count. 0 or less reads the first row, as
 * V1 did; past the end of the ladder (a few boss entries) is `undefined`, so the caller shows
 * "level unknown" instead of a wrong level.
 */
export function resolveLadderRow(
  npc: Pick<NpcRecord, "stats"> | undefined,
  ladderIndex: number
): ResolvedLadderRow | undefined {
  if (!npc) return undefined
  const servedIndex = Math.max(0, ladderIndex - 1)
  const row = npc.stats[servedIndex]
  return row ? { servedIndex, row } : undefined
}
