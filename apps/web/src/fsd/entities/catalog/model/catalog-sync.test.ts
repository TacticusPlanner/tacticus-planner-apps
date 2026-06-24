import "fake-indexeddb/auto"

import { beforeEach, describe, expect, it } from "vitest"

import type { CatalogClient } from "./catalog-api"
import {
  catalogDatasetKeys,
  selectChangedDatasets,
  syncCatalog,
  type CatalogDatasetKey,
  type CatalogDatasetResponse,
  type CatalogManifest,
  type CatalogManifestDataset,
} from "./catalog-sync"
import {
  clearCatalogDb,
  getCatalogMetadata,
  getDatasetRecords,
} from "./catalog-storage"

describe("catalog sync", () => {
  beforeEach(async () => {
    await clearCatalogDb()
  })

  it("selects only datasets with changed hashes", () => {
    const manifest = createManifest([
      createManifestDataset("units", "units-v2"),
      createManifestDataset("campaign-events", "events-v1"),
    ])
    const metadata = new Map([
      [
        "units",
        {
          catalogVersion: "v1",
          hash: "units-v1",
          key: "units" as const,
          schemaVersion: 1,
          updatedAt: "2026-06-24T00:00:00.000Z",
        },
      ],
      [
        "campaign-events",
        {
          catalogVersion: "v1",
          hash: "events-v1",
          key: "campaign-events" as const,
          schemaVersion: 1,
          updatedAt: "2026-06-24T00:00:00.000Z",
        },
      ],
    ])

    expect(
      selectChangedDatasets(manifest, metadata).map((item) => item.key)
    ).toEqual(["units"])
  })

  it("downloads all chunks on first sync and stores indexed records", async () => {
    const client = new FakeCatalogClient(createManifest())

    const result = await syncCatalog(client)

    expect(result).toEqual({
      downloadedDatasets: catalogDatasetKeys,
      status: "ready",
    })
    expect(client.downloadedDatasets).toEqual(catalogDatasetKeys)

    const metadata = await getCatalogMetadata()
    const campaignEvents = await getDatasetRecords("campaign-events")

    expect(metadata.get("__manifest")?.hash).toBe("source-v1")
    expect(metadata.get("campaign-events")?.hash).toBe("campaign-events-v1")
    expect(campaignEvents).toHaveLength(1)
    expect(campaignEvents[0]?.searchText).toContain("campaign-events")
  })

  it("uses manifest 304 to keep the local cache without dataset downloads", async () => {
    const firstClient = new FakeCatalogClient(createManifest())

    await syncCatalog(firstClient)

    const secondClient = new FakeCatalogClient(createManifest(), true)
    const result = await syncCatalog(secondClient)

    expect(result).toEqual({
      downloadedDatasets: [],
      status: "ready",
    })
    expect(secondClient.downloadedDatasets).toEqual([])
  })

  it("downloads only a changed campaign events chunk", async () => {
    const firstClient = new FakeCatalogClient(createManifest())

    await syncCatalog(firstClient)

    const secondManifest = createManifest([
      ...catalogDatasetKeys
        .filter((key) => key !== "campaign-events")
        .map((key) => createManifestDataset(key, `${key}-v1`)),
      createManifestDataset("campaign-events", "campaign-events-v2"),
    ])
    const secondClient = new FakeCatalogClient(secondManifest)
    const result = await syncCatalog(secondClient)

    expect(result).toEqual({
      downloadedDatasets: ["campaign-events"],
      status: "ready",
    })
    expect(secondClient.downloadedDatasets).toEqual(["campaign-events"])
  })
})

class FakeCatalogClient implements CatalogClient {
  readonly downloadedDatasets: CatalogDatasetKey[] = []
  private readonly manifest: CatalogManifest
  private readonly notModified: boolean

  constructor(manifest: CatalogManifest, notModified = false) {
    this.manifest = manifest
    this.notModified = notModified
  }

  async getManifest() {
    if (this.notModified) {
      return { status: "not-modified" as const }
    }

    return {
      etag: `"${this.manifest.sourceHash}"`,
      manifest: this.manifest,
      status: "ok" as const,
    }
  }

  async getDataset<TItem extends Record<string, unknown>>(
    dataset: CatalogManifestDataset
  ) {
    this.downloadedDatasets.push(dataset.key)

    return {
      datasetHash: dataset.hash,
      datasetKey: dataset.key,
      items: [
        {
          id: dataset.key,
          name: `${dataset.key} record`,
        },
      ] as unknown as TItem[],
      schemaVersion: this.manifest.schemaVersion,
      sourceHash: this.manifest.sourceHash,
      version: this.manifest.version,
    } satisfies CatalogDatasetResponse<TItem>
  }
}

function createManifest(
  datasets = catalogDatasetKeys.map((key) =>
    createManifestDataset(key, `${key}-v1`)
  )
): CatalogManifest {
  return {
    datasets,
    schemaVersion: 1,
    sourceHash: "source-v1",
    version: "v1",
  }
}

function createManifestDataset(
  key: CatalogDatasetKey,
  hash: string
): CatalogManifestDataset {
  return {
    hash,
    key,
    url: `/api/v1/catalog/${key}`,
  }
}
