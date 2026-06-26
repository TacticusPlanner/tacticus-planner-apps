import type { GameCatalogClient } from "./game-catalog-api"
import {
  getGameCatalogMetadata,
  getManifestMetadata,
  hasCompleteGameCatalogCache,
  replaceGameCatalogDataset,
  saveManifestMetadata,
} from "./game-catalog-storage"
import {
  catalogManifestMetadataKey,
  isServedDatasetKey,
  type GameCatalogDatasetKey,
  type GameCatalogManifest,
  type GameCatalogManifestDataset,
  type GameCatalogDatasetMetadata,
} from "./types"

export type GameCatalogSyncProgress = {
  downloaded: number
  total: number
  current?: GameCatalogDatasetKey
}

export type GameCatalogSyncResult = {
  status: "ready" | "stale"
  gameVersion: string
  firstTime: boolean
  downloaded: GameCatalogDatasetKey[]
}

export type GameCatalogSyncOptions = {
  onProgress?: (progress: GameCatalogSyncProgress) => void
}

export function selectChangedDatasets(
  manifest: GameCatalogManifest,
  metadata: ReadonlyMap<string, GameCatalogDatasetMetadata>
): GameCatalogManifestDataset[] {
  return manifest.datasets.filter((dataset) => {
    if (!isServedDatasetKey(dataset.key)) {
      return false
    }

    const local = metadata.get(dataset.key)

    return !local || local.hash !== dataset.hash
  })
}

/**
 * Manifest-driven delta sync: downloads only the served datasets whose hash changed, replaces them in
 * IndexedDB, and persists manifest metadata. Reports per-dataset progress for the init loader.
 */
export async function syncGameCatalog(
  client: GameCatalogClient,
  options: GameCatalogSyncOptions = {}
): Promise<GameCatalogSyncResult> {
  const metadata = await getGameCatalogMetadata()
  const manifestMetadata = getManifestMetadata(metadata)
  const firstTime = !manifestMetadata

  const manifestResult = await client.getManifest(
    manifestMetadata?.etag ?? undefined
  )

  if (manifestResult.status === "not-modified") {
    const ready = await hasCompleteGameCatalogCache()

    return {
      status: ready ? "ready" : "stale",
      gameVersion: manifestMetadata?.gameVersion ?? "",
      firstTime: false,
      downloaded: [],
    }
  }

  const { manifest, etag } = manifestResult

  const changedDatasets = selectChangedDatasets(manifest, metadata)
  const total = changedDatasets.length
  const downloaded: GameCatalogDatasetKey[] = []
  const failures: { key: GameCatalogDatasetKey; error: unknown }[] = []

  options.onProgress?.({ downloaded: 0, total })

  for (const dataset of changedDatasets) {
    const datasetKey = dataset.key as GameCatalogDatasetKey

    options.onProgress?.({
      downloaded: downloaded.length,
      total,
      current: datasetKey,
    })

    // Per-dataset resilience: a single bad dataset is collected and surfaced after the loop instead of
    // aborting the rest — so one failure can no longer wedge the init loader with a partial cache.
    try {
      const envelope = await client.getDataset(dataset)

      await replaceGameCatalogDataset(datasetKey, envelope.data, {
        key: datasetKey,
        hash: envelope.datasetHash,
        catalogVersion: envelope.version,
        gameVersion: envelope.gameVersion,
        schemaVersion: envelope.schemaVersion,
        updatedAt: new Date().toISOString(),
        url: dataset.url,
      })

      downloaded.push(datasetKey)
    } catch (error) {
      failures.push({ key: datasetKey, error })
    }

    options.onProgress?.({
      downloaded: downloaded.length,
      total,
      current: datasetKey,
    })
  }

  if (failures.length > 0) {
    // Do not advance the manifest sync metadata: the failed datasets (whose per-dataset metadata was not
    // written) will be re-selected on the next sync/retry.
    const detail = failures
      .map((failure) => `${failure.key}: ${describeError(failure.error)}`)
      .join("; ")

    throw new Error(
      `Failed to sync ${failures.length} catalog dataset(s) — ${detail}`
    )
  }

  await saveManifestMetadata({
    key: catalogManifestMetadataKey,
    hash: manifest.sourceHash,
    catalogVersion: manifest.version,
    gameVersion: manifest.gameVersion,
    schemaVersion: manifest.schemaVersion,
    updatedAt: new Date().toISOString(),
    etag,
  })

  const ready = await hasCompleteGameCatalogCache()

  return {
    status: ready ? "ready" : "stale",
    gameVersion: manifest.gameVersion,
    firstTime,
    downloaded,
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
