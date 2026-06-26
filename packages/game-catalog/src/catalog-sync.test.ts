import { beforeEach, describe, expect, it } from "vitest"

import type { CatalogClient, CatalogManifestResult } from "./catalog-api"
import {
  getDatasetExtras,
  getDatasetRecords,
  hasCompleteCatalogCache,
  searchDataset,
} from "./catalog-storage"
import { syncCatalog } from "./catalog-sync"
import {
  servedDatasetKeys,
  type CatalogDatasetEnvelope,
  type CatalogManifest,
  type CatalogManifestDataset,
} from "./types"

const datasetData: Record<string, unknown> = {
  characters: [
    {
      id: "c1",
      name: "Apothecary",
      faction: "Ultramarines",
      alliance: "Imperial",
      initialRarity: "Common",
    },
  ],
  npcs: [{ id: "n1", name: "Drone" }],
  mows: {
    items: [
      {
        id: "m1",
        name: "Stomper",
        faction: "Orks",
        alliance: "Xenos",
        unitKind: "mow",
      },
    ],
    upgradeCosts: [{ gold: 10, salvage: 5 }],
  },
  upgrades: [
    {
      id: "u1",
      material: "Seal",
      rarity: "Common",
      stat: "Armour",
      craftable: false,
      recipe: [],
    },
  ],
  equipment: {
    items: [{ id: "e1", name: "Field", rarity: "Common", type: "I_Crit" }],
    upgradeCostsByRarity: [{ rarity: "Common", levels: [] }],
  },
  "campaign-battles": [
    {
      groupId: "g1",
      faction: "Ultramarines",
      releaseType: "standard",
      battles: [],
    },
  ],
  lres: [{ id: 12, unitSnowprintId: "emperLucius", name: "Lucius" }],
}

function createManifest(hashes: Record<string, string> = {}): CatalogManifest {
  return {
    version: "dev-1",
    schemaVersion: 9,
    gameVersion: "1.40",
    sourceHash: `source-${Object.values(hashes).join("-") || "base"}`,
    datasets: servedDatasetKeys.map((key) => ({
      key,
      hash: hashes[key] ?? `${key}-h1`,
      url: `/api/v1/catalog/${key}`,
    })),
  }
}

class FakeCatalogClient implements CatalogClient {
  readonly downloaded: string[] = []

  constructor(
    private readonly manifest: CatalogManifest,
    private readonly notModified = false,
    private readonly dataOverride: Record<string, unknown> = {}
  ) {}

  getManifest(): Promise<CatalogManifestResult> {
    if (this.notModified) {
      return Promise.resolve({ status: "not-modified" })
    }

    return Promise.resolve({
      status: "ok",
      etag: `"${this.manifest.sourceHash}"`,
      manifest: this.manifest,
    })
  }

  getDataset(dataset: CatalogManifestDataset): Promise<CatalogDatasetEnvelope> {
    this.downloaded.push(dataset.key)

    return Promise.resolve({
      version: this.manifest.version,
      schemaVersion: this.manifest.schemaVersion,
      gameVersion: this.manifest.gameVersion,
      sourceHash: this.manifest.sourceHash,
      datasetKey: dataset.key,
      datasetHash: dataset.hash,
      data: this.dataOverride[dataset.key] ?? datasetData[dataset.key],
    })
  }
}

function resetDb() {
  return new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase("tacticus-planner-catalog")

    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

beforeEach(resetDb)

describe("syncCatalog", () => {
  it("downloads every dataset on first sync and stores denormalized records", async () => {
    const client = new FakeCatalogClient(createManifest())

    const result = await syncCatalog(client)

    expect(result.status).toBe("ready")
    expect(result.firstTime).toBe(true)
    expect(result.gameVersion).toBe("1.40")
    expect(result.downloaded.sort()).toEqual([...servedDatasetKeys].sort())
    expect(await hasCompleteCatalogCache()).toBe(true)

    const characters = await getDatasetRecords("characters")
    expect(characters).toHaveLength(1)
    expect(characters[0]?.id).toBe("c1")
    expect(characters[0]?.searchText).toContain("ultramarines")

    // campaign-battles groups key on groupId; lres ids are coerced to strings.
    expect((await getDatasetRecords("campaign-battles"))[0]?.id).toBe("g1")
    expect((await getDatasetRecords("lres"))[0]?.id).toBe("12")

    // Wrapper datasets store their shared tables as extras, not as records.
    expect(await getDatasetExtras("mows")).toEqual({
      upgradeCosts: [{ gold: 10, salvage: 5 }],
    })
    expect(await getDatasetExtras("equipment")).toEqual({
      upgradeCostsByRarity: [{ rarity: "Common", levels: [] }],
    })
  })

  it("searches a dataset via the normalized searchText", async () => {
    await syncCatalog(new FakeCatalogClient(createManifest()))

    expect(await searchDataset("characters", "apoth")).toHaveLength(1)
    expect(await searchDataset("characters", "nope")).toHaveLength(0)
  })

  it("treats a 304 with a complete cache as ready and a later sync as not first-time", async () => {
    await syncCatalog(new FakeCatalogClient(createManifest()))

    const result = await syncCatalog(
      new FakeCatalogClient(createManifest(), true)
    )

    expect(result.status).toBe("ready")
    expect(result.firstTime).toBe(false)
    expect(result.gameVersion).toBe("1.40")
  })

  it("only downloads datasets whose hash changed", async () => {
    await syncCatalog(new FakeCatalogClient(createManifest()))

    const client = new FakeCatalogClient(
      createManifest({ upgrades: "upgrades-h2" })
    )
    const result = await syncCatalog(client)

    expect(client.downloaded).toEqual(["upgrades"])
    expect(result.downloaded).toEqual(["upgrades"])
    expect(result.status).toBe("ready")
  })

  it("wipes and replaces a changed chunk's store (stale records removed)", async () => {
    await syncCatalog(new FakeCatalogClient(createManifest()))
    expect(
      (await getDatasetRecords("characters")).map((record) => record.id)
    ).toEqual(["c1"])

    // Re-sync with a changed characters hash and a different record set.
    const client = new FakeCatalogClient(
      createManifest({ characters: "characters-h2" }),
      false,
      {
        characters: [{ id: "c2", name: "Replacement" }],
      }
    )
    await syncCatalog(client)

    expect(client.downloaded).toEqual(["characters"])
    expect(
      (await getDatasetRecords("characters")).map((record) => record.id)
    ).toEqual(["c2"])
  })
})
