// The player-data chunks served by GET /api/v1/me/player-data/{key} — the per-profile analogue of
// @workspace/game-catalog's served dataset keys. Split for client-side partial-update granularity: see
// ADR 0007 (player-data snapshot and manifest) in the docs repo.
export const playerDataChunkKeys = [
  "player-details",
  "characters",
  "mows",
  "inventory-upgrades",
  "inventory-items",
  "inventory",
  "campaign-progress",
  "campaign-events-progress",
  "game-mode-tokens",
  "lre-progress",
] as const

export type PlayerDataChunkKey = (typeof playerDataChunkKeys)[number]

// Metadata-store key for the manifest sync metadata (etag/hash/syncedAt) used for delta sync.
export const playerDataManifestMetadataKey = "__manifest"

export function isPlayerDataChunkKey(
  value: string
): value is PlayerDataChunkKey {
  return (playerDataChunkKeys as readonly string[]).includes(value)
}
