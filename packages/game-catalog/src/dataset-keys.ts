// The denormalized datasets served by the game catalog API. Each maps 1:1 to
// GET /api/v1/game-catalog/{key}.
export const servedDatasetKeys = [
  "characters",
  "npcs",
  "mows",
  "mow-upgrade-costs",
  "character-ability-costs",
  "ascension-costs",
  "unlock-shard-costs",
  "onslaught-rewards",
  "upgrades",
  "equipment",
  "campaign-battles",
  "campaign-definitions",
  "lres",
  "lre-battles",
  "horde-mode-tiers",
  "event-definitions",
  "events-calendar",
  "shops",
  "raid-bosses",
  "guild-raid-meta",
  "mythic-quests",
  "unit-power",
] as const

export type GameCatalogDatasetKey = (typeof servedDatasetKeys)[number]

// Served datasets the cache counts as complete without: an API that does not serve one yet (or no
// longer does) leaves the client ready, and the features reading it treat it as absent.
export const optionalDatasetKeys: readonly GameCatalogDatasetKey[] = [
  "horde-mode-tiers",
  "unit-power",
]

// Metadata-store key for the manifest sync metadata (etag/version) used for delta sync.
export const catalogManifestMetadataKey = "__manifest"

export function isServedDatasetKey(
  value: string
): value is GameCatalogDatasetKey {
  return (servedDatasetKeys as readonly string[]).includes(value)
}
