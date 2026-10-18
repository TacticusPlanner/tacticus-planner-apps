import type { NpcRecord } from "../model/types"
import { isVariationAvailable } from "./build-npc-groups"
import { npcSlug } from "./npc-slug"

/**
 * The NPC Library URL for a variation at a served ladder index, or `undefined` when the Library does
 * not list that variation (not a `unit`, or an all-zero ladder; see `buildNpcGroups`).
 */
export function npcLibraryHref(
  npc: NpcRecord,
  servedIndex?: number
): string | undefined {
  if (npc.kind !== "unit" || !isVariationAvailable(npc)) return undefined
  const query = new URLSearchParams({ variation: npc.id })
  if (servedIndex !== undefined) query.set("level", String(servedIndex))
  return `/library/npcs/${npcSlug(npc.name)}?${query.toString()}`
}
