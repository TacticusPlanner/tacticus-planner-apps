export {
  playerDataChunkKeys,
  isPlayerDataChunkKey,
  isSplitPlayerDataChunkKey,
  playerDataManifestMetadataKey,
  splitPlayerDataChunkKeys,
  type PlayerDataChunkKey,
  type SplitPlayerDataChunkKey,
  type PlayerDataManifest,
  type PlayerDataManifestChunk,
  type PlayerDataChunkEnvelope,
  type PlayerDataChunkDto,
} from "./player-data.dto"

export { type PlayerDataMetadataStorageModel } from "./player-data.storage"

// The HTTP client, sync loop and zod schemas live behind `@workspace/player-data/sync` so they load
// only when a sync runs; the types stay here because they are erased.
export type { PlayerDataClient } from "./player-data-api"

export type {
  PlayerDataSyncResult,
  PlayerDataSyncProgress,
  PlayerDataSyncOptions,
} from "./player-data-sync"

export {
  getPlayerDataMetadata,
  getManifestMetadata,
  hasCompletePlayerDataCache,
  clearPlayerDataDb,
  deletePlayerDataDb,
} from "./player-data-storage"
