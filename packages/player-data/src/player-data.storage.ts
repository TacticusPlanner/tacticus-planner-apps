import {
  playerDataManifestMetadataKey,
  type PlayerDataChunkKey,
} from "./chunk-keys"

// Internal IndexedDB metadata (not an API shape): per-chunk rows + the manifest sync-metadata row.
export type PlayerDataMetadataStorageModel = {
  key: PlayerDataChunkKey | typeof playerDataManifestMetadataKey
  hash: string
  schemaVersion: number
  updatedAt: string
  etag?: string | null
  url?: string
}
