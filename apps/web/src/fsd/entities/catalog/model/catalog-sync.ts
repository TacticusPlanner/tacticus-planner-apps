import type { CatalogClient } from "./catalog-api"
import {
  getCatalogMetadata,
  getManifestMetadata,
  hasCompleteCatalogCache,
  replaceCatalogDataset,
  saveManifestMetadata,
} from "./catalog-storage"

export const catalogDatasetKeys = [
  "units",
  "mows",
  "upgrades",
  "equipment",
  "campaigns",
  "campaign-events",
  "campaign-battles",
  "lres",
] as const

export const catalogManifestMetadataKey = "__manifest"

export type CatalogDatasetKey = (typeof catalogDatasetKeys)[number]

export type CatalogManifestDataset = {
  hash: string
  key: CatalogDatasetKey
  url: string
}

export type CatalogManifest = {
  datasets: CatalogManifestDataset[]
  schemaVersion: number
  sourceHash: string
  version: string
}

export type CatalogDatasetResponse<TItem extends Record<string, unknown>> = {
  datasetHash: string
  datasetKey: CatalogDatasetKey
  items: TItem[]
  schemaVersion: number
  sourceHash: string
  version: string
}

export type CatalogDatasetMetadata = {
  catalogVersion: string
  etag?: string | null
  hash: string
  key: CatalogDatasetKey | typeof catalogManifestMetadataKey
  schemaVersion: number
  updatedAt: string
  url?: string
}

export type CatalogSyncResult = {
  downloadedDatasets: CatalogDatasetKey[]
  status: "ready" | "stale"
}

export function selectChangedDatasets(
  manifest: CatalogManifest,
  metadata: ReadonlyMap<string, CatalogDatasetMetadata>
) {
  return manifest.datasets.filter((dataset) => {
    const local = metadata.get(dataset.key)

    return !local || local.hash !== dataset.hash
  })
}

export async function syncCatalog(client: CatalogClient) {
  const metadata = await getCatalogMetadata()
  const manifestMetadata = getManifestMetadata(metadata)
  const manifestResult = await client.getManifest(
    manifestMetadata?.etag ?? undefined
  )

  if (manifestResult.status === "not-modified") {
    if (await hasCompleteCatalogCache()) {
      return {
        downloadedDatasets: [],
        status: "ready",
      } satisfies CatalogSyncResult
    }

    return {
      downloadedDatasets: [],
      status: "stale",
    } satisfies CatalogSyncResult
  }

  const changedDatasets = selectChangedDatasets(
    manifestResult.manifest,
    metadata
  )
  const downloadedDatasets: CatalogDatasetKey[] = []

  for (const dataset of changedDatasets) {
    const response = await client.getDataset(dataset)

    await replaceCatalogDataset(dataset.key, response.items, {
      catalogVersion: response.version,
      hash: response.datasetHash,
      key: dataset.key,
      schemaVersion: response.schemaVersion,
      updatedAt: new Date().toISOString(),
      url: dataset.url,
    })
    downloadedDatasets.push(dataset.key)
  }

  await saveManifestMetadata({
    catalogVersion: manifestResult.manifest.version,
    etag: manifestResult.etag,
    hash: manifestResult.manifest.sourceHash,
    key: catalogManifestMetadataKey,
    schemaVersion: manifestResult.manifest.schemaVersion,
    updatedAt: new Date().toISOString(),
  })

  return {
    downloadedDatasets,
    status: "ready",
  } satisfies CatalogSyncResult
}
