// The denormalized datasets served by the game catalog API. Each maps 1:1 to
// GET /api/v1/game-catalog/{key}.
export const servedDatasetKeys = [
  "characters",
  "npcs",
  "mows",
  "mow-upgrade-costs",
  "upgrades",
  "equipment",
  "campaign-battles",
  "campaign-definitions",
  "lres",
] as const

export type CatalogDatasetKey = (typeof servedDatasetKeys)[number]

// Metadata-store keys for the persisted manifest: sync metadata (etag/version) and the full body.
export const catalogManifestMetadataKey = "__manifest"
export const catalogManifestBodyKey = "__manifest-body"

export function isServedDatasetKey(value: string): value is CatalogDatasetKey {
  return (servedDatasetKeys as readonly string[]).includes(value)
}
