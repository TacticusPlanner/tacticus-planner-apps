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
  "npc-tiers",
  "event-definitions",
  "events-calendar",
  "shops",
  "event-shops",
  "raid-bosses",
  "guild-raid-meta",
  "mythic-quests",
  "unit-power",
  "quest-events",
  "quest-crates",
  "factions",
  "damage-types",
  "global-values",
  "progression-rules",
  "hre",
  "incursions",
  "npc-encounters",
  "guild-war",
  "survival-events",
] as const

export type GameCatalogDatasetKey = (typeof servedDatasetKeys)[number]

// Served datasets the cache counts as complete without: an API that does not serve one yet (or no
// longer does) leaves the client ready, and the features reading it treat it as absent.
export const optionalDatasetKeys: readonly GameCatalogDatasetKey[] = [
  "horde-mode-tiers",
  // Served once the API ships it; without it every enemy NPC is untiered (multiplier 1.0).
  "npc-tiers",
  "unit-power",
  "quest-events",
  "quest-crates",
  // Served once the API ships the dataset; the Incursion page reads it behind its feature flag.
  "incursions",
  // Served once the API ships it; without it the NPC Library hides its encounters section and game-mode filter.
  "npc-encounters",
  // Served once the API ships seasonal event shops; without it the Event shop page shows its empty state.
  "event-shops",
  // Served once the API ships it; without it the Guild War pages show no zones and log no attacks.
  "guild-war",
  // Served once the API ships it; without it the Survival page shows its empty state.
  "survival-events",
]

// Metadata-store key for the manifest sync metadata (etag/version) used for delta sync.
export const catalogManifestMetadataKey = "__manifest"

export function isServedDatasetKey(
  value: string
): value is GameCatalogDatasetKey {
  return (servedDatasetKeys as readonly string[]).includes(value)
}
