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
  "live-progress",
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

// Chunks whose payload is a list of records with a natural per-record identity (a unit/upgrade/item
// id, or a campaign id + type pair) — these are stored as one row per record, mirroring
// @workspace/game-catalog's id-keyed dataset stores, instead of one row for the whole chunk. The
// remaining chunks (`player-details`, `inventory`, `live-progress`) are singleton objects that don't
// split cleanly and stay a single whole-payload row (see player-data-storage.ts).
export const splitPlayerDataChunkKeys = [
  "characters",
  "mows",
  "inventory-upgrades",
  "inventory-items",
  "campaign-progress",
  "campaign-events-progress",
  "lre-progress",
] as const

export type SplitPlayerDataChunkKey = (typeof splitPlayerDataChunkKeys)[number]

export function isSplitPlayerDataChunkKey(
  key: PlayerDataChunkKey
): key is SplitPlayerDataChunkKey {
  return (splitPlayerDataChunkKeys as readonly string[]).includes(key)
}
