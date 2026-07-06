import type { z } from "zod"

import {
  playerDataManifestMetadataKey,
  type PlayerDataChunkKey,
} from "./chunk-keys"
import type {
  playerDataChunkEnvelopeMetaSchema,
  playerDataChunkPayloadSchemas,
  playerDataManifestChunkSchema,
  playerDataManifestSchema,
} from "./schemas"

export {
  playerDataChunkKeys,
  isPlayerDataChunkKey,
  playerDataManifestMetadataKey,
  type PlayerDataChunkKey,
} from "./chunk-keys"

// All player-data API shapes are inferred from the zod schemas that validate them at runtime.
export type PlayerDataManifest = z.infer<typeof playerDataManifestSchema>
export type PlayerDataManifestChunk = z.infer<
  typeof playerDataManifestChunkSchema
>
export type PlayerDataChunkEnvelope = z.infer<
  typeof playerDataChunkEnvelopeMetaSchema
>

export type PlayerDataChunkPayload<K extends PlayerDataChunkKey> = z.infer<
  (typeof playerDataChunkPayloadSchemas)[K]
>

// Internal IndexedDB metadata (not an API shape): per-chunk rows + the manifest sync-metadata row.
export type PlayerDataMetadata = {
  key: PlayerDataChunkKey | typeof playerDataManifestMetadataKey
  hash: string
  schemaVersion: number
  updatedAt: string
  etag?: string | null
  url?: string
}
