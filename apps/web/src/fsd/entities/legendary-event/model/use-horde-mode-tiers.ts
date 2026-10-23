import { useCatalogDataset } from "@/shared/local-data"

import type { HordeModeTierList } from "../lib/horde-tier-list"
import type { ReadState } from "./use-read-state"

function firstRecord<T>(records: T[]): T | null {
  return records[0] ?? null
}

/** The catalog `horde-mode-tiers` record; `data` is null when the catalog has no such record. */
export function useHordeModeTiers(): ReadState<HordeModeTierList | null> {
  return useCatalogDataset("horde-mode-tiers", firstRecord)
}
