import { runManifestSync } from "@workspace/manifest-sync"

import type { GameCatalogClient } from "./game-catalog-api"
import {
  getGameCatalogMetadata,
  getManifestMetadata,
  hasCompleteGameCatalogCache,
  removeGameCatalogDataset,
  replaceGameCatalogDataset,
  saveManifestMetadata,
} from "./game-catalog-storage"
import { optionalDatasetKeys } from "./dataset-keys"
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
  /** The manifest's game version being synced to, known once dataset downloads start. */
  gameVersion: string
  firstTime: boolean
}

export type GameCatalogSyncResult = {
  status: "ready" | "stale"
  gameVersion: string
  firstTime: boolean
  downloaded: GameCatalogDatasetKey[]
  /** Optional datasets the manifest withdrew, whose stored copies were dropped. */
  removed: GameCatalogDatasetKey[]
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

  let manifestResult = await client.getManifest(
    manifestMetadata?.etag ?? undefined
  )

  if (manifestResult.status === "not-modified") {
    const ready = await hasCompleteGameCatalogCache()

    if (ready) {
      return {
        status: "ready",
        gameVersion: manifestMetadata?.gameVersion ?? "",
        firstTime: false,
        downloaded: [],
        removed: [],
      }
    }

    // A valid manifest ETag does not prove IndexedDB is complete: browser storage can be partially
    // evicted, or a migrated client can be missing metadata for a newly introduced dataset. Refetch
    // without the conditional header so the normal hash-driven path can repair only what is missing.
    manifestResult = await client.getManifest()

    if (manifestResult.status === "not-modified") {
      throw new Error(
        "GameCatalog manifest returned not-modified for an unconditional recovery request."
      )
    }
  }

  const { manifest, etag } = manifestResult

  const changed = selectChangedDatasets(manifest, metadata)
  const { downloaded, removed } = await runManifestSync({
    items: changed,
    keyOf: (dataset) => dataset.key as GameCatalogDatasetKey,
    label: "catalog dataset",
    // Nothing to download (a changed manifest whose datasets this client already holds, or one read
    // without its ETag): report no progress, so the init loader does not flash its update overlay.
    onProgress:
      options.onProgress && changed.length > 0
        ? (progress) =>
            options.onProgress?.({
              ...progress,
              gameVersion: manifest.gameVersion,
              firstTime,
            })
        : undefined,
    download: async (dataset) => {
      const datasetKey = dataset.key as GameCatalogDatasetKey
      const envelope = await client.getDataset(dataset)

      await replaceGameCatalogDataset(datasetKey, envelope.data, {
        key: datasetKey,
        hash: envelope.datasetHash,
        catalogVersion: envelope.version,
        gameVersion: envelope.gameVersion,
        schemaHash: envelope.schemaHash,
        updatedAt: new Date().toISOString(),
        url: dataset.url,
      })
    },
    finalize: async () => {
      // An optional dataset the API stopped serving is withdrawn: drop its stored copy so readers see
      // it as absent rather than serving the last synced records.
      const listedKeys = new Set(
        manifest.datasets.map((dataset) => dataset.key)
      )
      const withdrawn = optionalDatasetKeys.filter(
        (datasetKey) => !listedKeys.has(datasetKey) && metadata.has(datasetKey)
      )
      for (const datasetKey of withdrawn) {
        await removeGameCatalogDataset(datasetKey)
      }

      await saveManifestMetadata({
        key: catalogManifestMetadataKey,
        hash: manifest.sourceHash,
        catalogVersion: manifest.version,
        gameVersion: manifest.gameVersion,
        schemaHash: manifest.schemaHash,
        updatedAt: new Date().toISOString(),
        etag,
      })

      return withdrawn
    },
  })

  const ready = await hasCompleteGameCatalogCache()

  return {
    status: ready ? "ready" : "stale",
    gameVersion: manifest.gameVersion,
    firstTime,
    downloaded,
    removed,
  }
}
