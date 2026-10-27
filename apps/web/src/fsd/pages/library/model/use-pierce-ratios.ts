import { useCatalogDataset } from "@/shared/local-data"

import { toPierceRatios, type PierceRatios } from "./pierce-ratios"

const noPierceRatios: PierceRatios = new Map()

/** The catalog's pierce ratios by damage type; empty until the `damage-types` dataset is read. */
export function usePierceRatios(): PierceRatios {
  const read = useCatalogDataset("damage-types", toPierceRatios)
  return read.status === "ready" ? read.data : noPierceRatios
}
