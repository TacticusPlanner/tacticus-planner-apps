import { useCatalogDataset, firstRecord } from "@/shared/local-data"

import type { HordeModeTierList } from "../lib/horde-tier-list"
import type { ReadState } from "./use-read-state"

/** The catalog `horde-mode-tiers` record; `data` is null when the catalog has no such record. */
export function useHordeModeTiers(): ReadState<HordeModeTierList | null> {
  return useCatalogDataset("horde-mode-tiers", firstRecord)
}
