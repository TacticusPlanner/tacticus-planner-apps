import type { CatalogClient } from "./catalog-api"
import {
  getCatalogMetadata,
  getManifestMetadata,
  hasCompleteCatalogCache,
  replaceCatalogDataset,
  saveManifestMetadata,
} from "./catalog-storage"
import {
  catalogManifestMetadataKey,
  isServedDatasetKey,
  type CatalogDatasetKey,
  type CatalogManifest,
  type CatalogManifestDataset,
  type CatalogDatasetMetadata,
} from "./types"

export type CatalogSyncProgress = {
  downloaded: number
  total: number
  current?: CatalogDatasetKey
}

export type CatalogSyncResult = {
  status: "ready" | "stale"
  gameVersion: string
  firstTime: boolean
  downloaded: CatalogDatasetKey[]
}

export type CatalogSyncOptions = {
  onProgress?: (progress: CatalogSyncProgress) => void
}

export function selectChangedDatasets(
  manifest: CatalogManifest,
  metadata: ReadonlyMap<string, CatalogDatasetMetadata>
): CatalogManifestDataset[] {
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
export async function syncCatalog(
  client: CatalogClient,
  options: CatalogSyncOptions = {}
): Promise<CatalogSyncResult> {
  const metadata = await getCatalogMetadata()
  const manifestMetadata = getManifestMetadata(metadata)
  const firstTime = !manifestMetadata

  const manifestResult = await client.getManifest(
    manifestMetadata?.etag ?? undefined
  )

  if (manifestResult.status === "not-modified") {
    const ready = await hasCompleteCatalogCache()

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
  const downloaded: CatalogDatasetKey[] = []

  options.onProgress?.({ downloaded: 0, total })

  for (const dataset of changedDatasets) {
    const datasetKey = dataset.key as CatalogDatasetKey

    options.onProgress?.({
      downloaded: downloaded.length,
      total,
      current: datasetKey,
    })

    const envelope = await client.getDataset(dataset)

    await replaceCatalogDataset(datasetKey, envelope.data, {
      key: datasetKey,
      hash: envelope.datasetHash,
      catalogVersion: envelope.version,
      gameVersion: envelope.gameVersion,
      schemaVersion: envelope.schemaVersion,
      updatedAt: new Date().toISOString(),
      url: dataset.url,
    })

    downloaded.push(datasetKey)
    options.onProgress?.({
      downloaded: downloaded.length,
      total,
      current: datasetKey,
    })
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

  const ready = await hasCompleteCatalogCache()

  return {
    status: ready ? "ready" : "stale",
    gameVersion: manifest.gameVersion,
    firstTime,
    downloaded,
  }
}
