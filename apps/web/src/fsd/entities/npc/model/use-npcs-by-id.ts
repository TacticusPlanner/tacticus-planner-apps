import type { ReadState } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import type { NpcRecord } from "./types"

export type NpcsByIdState = ReadState<ReadonlyMap<string, NpcRecord>>

/** Every served NPC variation by id, from the synced `npcs` dataset; `retry` re-issues a failed read. */
export function useNpcsById(): NpcsByIdState {
  return useCatalogDataset("npcs", toById)
}
