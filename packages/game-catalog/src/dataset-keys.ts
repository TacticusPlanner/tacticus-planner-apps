// The denormalized datasets served by the catalog API. Each maps 1:1 to GET /api/v1/catalog/{key}.
export const servedDatasetKeys = [
  "characters",
  "npcs",
  "mows",
  "upgrades",
  "equipment",
  "campaign-battles",
  "lres",
] as const

export type CatalogDatasetKey = (typeof servedDatasetKeys)[number]

export const catalogManifestMetadataKey = "__manifest"

export function isServedDatasetKey(value: string): value is CatalogDatasetKey {
  return (servedDatasetKeys as readonly string[]).includes(value)
}
