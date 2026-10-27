import { useCatalogDataset } from "@/shared/local-data"

import { toPierceRatios, type PierceRatios } from "./pierce-ratios"

/** The catalog's pierce ratios by damage type; undefined until the `damage-types` dataset is read
 *  (and while it has not synced), so callers show a placeholder rather than computing 0 pierce. */
export function usePierceRatios(): PierceRatios | undefined {
  const read = useCatalogDataset("damage-types", toPierceRatios)
  return read.status === "ready" && read.data.size > 0 ? read.data : undefined
}
