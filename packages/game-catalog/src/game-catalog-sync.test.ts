import { beforeEach, describe, expect, it } from "vitest"

import type {
  GameCatalogClient,
  GameCatalogManifestResult,
} from "./game-catalog-api"
import {
  getDatasetRecords,
  hasCompleteGameCatalogCache,
} from "./game-catalog-storage"
import { syncGameCatalog } from "./game-catalog-sync"
import {
  servedDatasetKeys,
  type GameCatalogDatasetEnvelope,
  type GameCatalogManifest,
  type GameCatalogManifestDataset,
} from "./types"

// The fake client bypasses zod (the real GameCatalogHttpClient validates); these records only need the shape
// the storage adapters key on (an id, a groupId, etc.), not the full served schema.
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
  mows: [{ id: "m1", name: "Stomper", faction: "Orks", unitKind: "mow" }],
  "mow-upgrade-costs": [
    { level: 2, gold: 10, salvage: 5 },
    { level: 3, gold: 20, salvage: 8 },
  ],
  upgrades: [
    { id: "u1", material: "Seal", rarity: "Common", craftable: false },
  ],
  equipment: [
    {
      id: "e1",
      name: "Field",
      rarity: "Common",
      type: "I_Crit",
      upgradeLevels: [{ goldCost: 0, salvageCost: 10, mythicSalvageCost: 0 }],
    },
  ],
  "campaign-battles": [
    { id: "I01", campaignGroupId: "g1", difficulty: "standard" },
  ],
  "campaign-definitions": [
    {
      groupId: "g1",
      faction: "Ultramarines",
      releaseType: "standard",
      battleIds: ["I01"],
    },
  ],
  lres: [{ id: "emperLucius", name: "Lucius" }],
}

function createManifest(
  hashes: Record<string, string> = {}
): GameCatalogManifest {
  return {
    version: "dev-1",
    schemaVersion: 11,
    gameVersion: "1.40",
    sourceHash: `source-${Object.values(hashes).join("-") || "base"}`,
    datasets: servedDatasetKeys.map((key) => ({
      key,
      hash: hashes[key] ?? `${key}-h1`,
      url: `/api/v1/game-catalog/${key}`,
    })),
  }
}

class FakeGameCatalogClient implements GameCatalogClient {
  readonly downloaded: string[] = []

  constructor(
    private readonly manifest: GameCatalogManifest,
    private readonly notModified = false,
    private readonly dataOverride: Record<string, unknown> = {},
    private readonly failKeys: ReadonlySet<string> = new Set()
  ) {}

  getManifest(): Promise<GameCatalogManifestResult> {
    if (this.notModified) {
      return Promise.resolve({ status: "not-modified" })
    }

    return Promise.resolve({
      status: "ok",
      etag: `"${this.manifest.sourceHash}"`,
      manifest: this.manifest,
    })
  }

  getDataset(
    dataset: GameCatalogManifestDataset
  ): Promise<GameCatalogDatasetEnvelope> {
    if (this.failKeys.has(dataset.key)) {
      return Promise.reject(new Error(`boom for ${dataset.key}`))
    }

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
    const request = indexedDB.deleteDatabase("tacticus-planner-game-catalog")

    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

beforeEach(resetDb)

describe("syncGameCatalog", () => {
  it("downloads every dataset on first sync and stores denormalized records", async () => {
    const client = new FakeGameCatalogClient(createManifest())

    const result = await syncGameCatalog(client)

    expect(result.status).toBe("ready")
    expect(result.firstTime).toBe(true)
    expect(result.gameVersion).toBe("1.40")
    expect(result.downloaded.sort()).toEqual([...servedDatasetKeys].sort())
    expect(await hasCompleteGameCatalogCache()).toBe(true)

    const characters = await getDatasetRecords("characters")
    expect(characters).toHaveLength(1)
    expect(characters[0]?.id).toBe("c1")

    // campaign-battles key on battle id (carrying campaignGroupId); campaign-definitions key on groupId.
    const battles = await getDatasetRecords("campaign-battles")
    expect(battles[0]?.id).toBe("I01")
    expect(battles[0]?.campaignGroupId).toBe("g1")
    expect((await getDatasetRecords("campaign-definitions"))[0]?.id).toBe("g1")

    // The mow upgrade-cost ladder is its own dataset, keyed by the ability level it raises a MoW to.
    const ladder = await getDatasetRecords("mow-upgrade-costs")
    expect(ladder.map((row) => row.id)).toEqual(["2", "3"])

    // lres key on the snowprint string id.
    expect((await getDatasetRecords("lres"))[0]?.id).toBe("emperLucius")
  })

  it("treats a 304 with a complete cache as ready and a later sync as not first-time", async () => {
    await syncGameCatalog(new FakeGameCatalogClient(createManifest()))

    const result = await syncGameCatalog(
      new FakeGameCatalogClient(createManifest(), true)
    )

    expect(result.status).toBe("ready")
    expect(result.firstTime).toBe(false)
    expect(result.gameVersion).toBe("1.40")
  })

  it("only downloads datasets whose hash changed", async () => {
    await syncGameCatalog(new FakeGameCatalogClient(createManifest()))

    const client = new FakeGameCatalogClient(
      createManifest({ upgrades: "upgrades-h2" })
    )
    const result = await syncGameCatalog(client)

    expect(client.downloaded).toEqual(["upgrades"])
    expect(result.downloaded).toEqual(["upgrades"])
    expect(result.status).toBe("ready")
  })

  it("wipes and replaces a changed chunk's store (stale records removed)", async () => {
    await syncGameCatalog(new FakeGameCatalogClient(createManifest()))
    expect(
      (await getDatasetRecords("characters")).map((record) => record.id)
    ).toEqual(["c1"])

    // Re-sync with a changed characters hash and a different record set.
    const client = new FakeGameCatalogClient(
      createManifest({ characters: "characters-h2" }),
      false,
      {
        characters: [{ id: "c2", name: "Replacement" }],
      }
    )
    await syncGameCatalog(client)

    expect(client.downloaded).toEqual(["characters"])
    expect(
      (await getDatasetRecords("characters")).map((record) => record.id)
    ).toEqual(["c2"])
  })

  it("surfaces an error naming a failed dataset without wedging the cache", async () => {
    const client = new FakeGameCatalogClient(
      createManifest(),
      false,
      {},
      new Set(["mows"])
    )

    await expect(syncGameCatalog(client)).rejects.toThrow(/mows/)

    // The failed dataset is incomplete (so a retry re-downloads it); the others still landed.
    expect(await hasCompleteGameCatalogCache()).toBe(false)
    expect(await getDatasetRecords("mows")).toHaveLength(0)
    expect(await getDatasetRecords("characters")).toHaveLength(1)
  })
})
