import type { z } from "zod"

import type { PlayerDataChunkKey } from "./chunk-keys"
import type {
  playerDataChunkEnvelopeMetaSchema,
  playerDataChunkPayloadSchemas,
  playerDataManifestChunkSchema,
  playerDataManifestSchema,
} from "./player-data.schema"

export {
  playerDataChunkKeys,
  isPlayerDataChunkKey,
  isSplitPlayerDataChunkKey,
  playerDataManifestMetadataKey,
  splitPlayerDataChunkKeys,
  type PlayerDataChunkKey,
  type SplitPlayerDataChunkKey,
} from "./chunk-keys"

// All player-data API shapes are inferred from the zod schemas that validate them at runtime.
export type PlayerDataManifest = z.infer<typeof playerDataManifestSchema>
export type PlayerDataManifestChunk = z.infer<
  typeof playerDataManifestChunkSchema
>
export type PlayerDataChunkEnvelope = z.infer<
  typeof playerDataChunkEnvelopeMetaSchema
>

export type PlayerDataChunkDto<K extends PlayerDataChunkKey> = z.infer<
  (typeof playerDataChunkPayloadSchemas)[K]
>
