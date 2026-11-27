import { useCatalogDataset, firstRecord } from "@/shared/local-data"

import type { NpcTierListRecord } from "../lib/npc-tier-list"
import type { ReadState } from "./use-read-state"

/** The catalog `npc-tiers` record; `data` is null when the catalog has no such record. */
export function useNpcTiers(): ReadState<NpcTierListRecord | null> {
  return useCatalogDataset("npc-tiers", firstRecord)
}
