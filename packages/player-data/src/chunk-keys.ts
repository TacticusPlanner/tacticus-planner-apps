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
// @workspace/game-catalog's id-keyed dataset stores, instead of one row for the whole chunk.
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

// The remaining three chunks don't have one single natural per-record identity the way the chunks
// above do, but they aren't each a single opaque blob either — `inventory` and `live-progress` both
// bundle a couple of naturally-keyed sub-collections (shards, mythic shards, xp books; battle
// attempts) alongside a handful of leftover scalars/small fixed-shape groups (requisition orders,
// badges/orbs/components; the active event id, game-mode tokens). Rather than giving each of these
// three chunks its own single-row object store, they share one "profile" store — each decomposed
// into a small "summary" record plus one row per naturally-keyed sub-item, every id prefixed with its
// own chunk key so a range query can address (or clear) exactly one chunk's rows. See
// player-data-storage.ts's `decomposeMergedChunk`/`reassembleMergedChunk`.
const mergedPlayerDataChunkKeys = [
  "player-details",
  "inventory",
  "live-progress",
] as const

export type MergedPlayerDataChunkKey =
  (typeof mergedPlayerDataChunkKeys)[number]

export function isMergedPlayerDataChunkKey(
  key: PlayerDataChunkKey
): key is MergedPlayerDataChunkKey {
  return (mergedPlayerDataChunkKeys as readonly string[]).includes(key)
}
