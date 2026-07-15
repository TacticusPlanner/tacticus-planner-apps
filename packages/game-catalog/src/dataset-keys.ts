// The denormalized datasets served by the game catalog API. Each maps 1:1 to
// GET /api/v1/game-catalog/{key}.
export const servedDatasetKeys = [
  "characters",
  "npcs",
  "mows",
  "mow-upgrade-costs",
  "ascension-costs",
  "unlock-shard-costs",
  "upgrades",
  "equipment",
  "campaign-battles",
  "campaign-definitions",
  "lres",
  "lre-battles",
  "lre-common",
] as const

export type GameCatalogDatasetKey = (typeof servedDatasetKeys)[number]

// Metadata-store key for the manifest sync metadata (etag/version) used for delta sync.
export const catalogManifestMetadataKey = "__manifest"

export function isServedDatasetKey(
  value: string
): value is GameCatalogDatasetKey {
  return (servedDatasetKeys as readonly string[]).includes(value)
}
