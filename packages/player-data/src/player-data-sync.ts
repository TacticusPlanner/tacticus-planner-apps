import type { PlayerDataClient } from "./player-data-api"
import {
  getManifestMetadata,
  getPlayerDataMetadata,
  hasCompletePlayerDataCache,
  replacePlayerDataChunk,
  saveManifestMetadata,
} from "./player-data-storage"
import {
  isPlayerDataChunkKey,
  playerDataManifestMetadataKey,
  type PlayerDataChunkKey,
  type PlayerDataManifest,
  type PlayerDataManifestChunk,
} from "./player-data.dto"
import type { PlayerDataMetadataStorageModel } from "./player-data.storage"

export type PlayerDataSyncProgress = {
  downloaded: number
  total: number
  current?: PlayerDataChunkKey
}

export type PlayerDataSyncResult = {
  status: "ready" | "stale"
  syncedAt: string
  firstTime: boolean
  downloaded: PlayerDataChunkKey[]
}

export type PlayerDataSyncOptions = {
  onProgress?: (progress: PlayerDataSyncProgress) => void
}

export function selectChangedChunks(
  manifest: PlayerDataManifest,
  metadata: ReadonlyMap<string, PlayerDataMetadataStorageModel>
): PlayerDataManifestChunk[] {
  return manifest.chunks.filter((chunk) => {
    if (!isPlayerDataChunkKey(chunk.key)) {
      return false
    }

    const local = metadata.get(chunk.key)

    return !local || local.hash !== chunk.hash
  })
}

/**
 * Triggers a Tacticus player-data sync on the backend, then performs a manifest-driven delta sync
 * into IndexedDB: downloads only the chunks whose hash changed and replaces them. Mirrors
 * @workspace/game-catalog's `syncGameCatalog`, but the manifest always comes from an authenticated
 * `POST .../player-sync` call (the backend's own `configHash` check decides whether anything actually
 * changed — reflected here as chunks simply not appearing in the changed set).
 */
export async function syncPlayerData(
  client: PlayerDataClient,
  options: PlayerDataSyncOptions = {}
): Promise<PlayerDataSyncResult> {
  const metadata = await getPlayerDataMetadata()
  const manifestMetadata = getManifestMetadata(metadata)
  const firstTime = !manifestMetadata

  const manifest = await client.triggerSync()

  const changedChunks = selectChangedChunks(manifest, metadata)
  const total = changedChunks.length
  const downloaded: PlayerDataChunkKey[] = []
  const failures: { key: PlayerDataChunkKey; error: unknown }[] = []

  options.onProgress?.({ downloaded: 0, total })

  for (const chunk of changedChunks) {
    const chunkKey = chunk.key as PlayerDataChunkKey

    options.onProgress?.({
      downloaded: downloaded.length,
      total,
      current: chunkKey,
    })

    // Per-chunk resilience: a single bad chunk is collected and surfaced after the loop instead of
    // aborting the rest, so one failure can't wedge the cache with a partial sync.
    try {
      const envelope = await client.getChunk(chunk)

      await replacePlayerDataChunk(chunkKey, envelope.data, {
        key: chunkKey,
        hash: envelope.chunkHash,
        schemaVersion: envelope.schemaVersion,
        updatedAt: new Date().toISOString(),
        url: chunk.url,
      })

      downloaded.push(chunkKey)
    } catch (error) {
      failures.push({ key: chunkKey, error })
    }

    options.onProgress?.({
      downloaded: downloaded.length,
      total,
      current: chunkKey,
    })
  }

  if (failures.length > 0) {
    // Do not advance the manifest sync metadata: the failed chunks (whose per-chunk metadata was not
    // written) will be re-selected on the next sync/retry.
    const detail = failures
      .map((failure) => `${failure.key}: ${describeError(failure.error)}`)
      .join("; ")

    throw new Error(
      `Failed to sync ${failures.length} player-data chunk(s) — ${detail}`
    )
  }

  await saveManifestMetadata({
    key: playerDataManifestMetadataKey,
    hash: manifest.sourceHash,
    schemaVersion: manifest.schemaVersion,
    updatedAt: manifest.syncedAt,
  })

  const ready = await hasCompletePlayerDataCache()

  return {
    status: ready ? "ready" : "stale",
    syncedAt: manifest.syncedAt,
    firstTime,
    downloaded,
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
