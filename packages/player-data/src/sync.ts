// Loaded on demand (`await import("@workspace/player-data/sync")`) so the HTTP client and the zod
// schemas stay out of the app's entry bundle.
export {
  playerDataManifestSchema,
  playerDataChunkEnvelopeMetaSchema,
  playerDataChunkPayloadSchemas,
} from "./player-data.schema"

export { PlayerDataHttpClient } from "./player-data-api"

export { syncPlayerData, selectChangedChunks } from "./player-data-sync"
