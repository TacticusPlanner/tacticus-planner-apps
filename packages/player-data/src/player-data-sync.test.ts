import { beforeEach, describe, expect, it } from "vitest"

import type {
  PlayerDataClient,
  PlayerDataManifestResult,
} from "./player-data-api"
import {
  getChunkData,
  getChunkRecord,
  hasCompletePlayerDataCache,
  playerDataDbName,
  playerDataDbVersion,
  splitChunkKeyPath,
} from "./player-data-storage"
import { syncPlayerData } from "./player-data-sync"
import {
  isSplitPlayerDataChunkKey,
  playerDataChunkKeys,
  type PlayerDataChunkEnvelope,
  type PlayerDataManifest,
  type PlayerDataManifestChunk,
} from "./types"

// The fake client bypasses zod (the real PlayerDataHttpClient validates); these payloads only need the
// shape the storage layer stores verbatim, not the full served schema.
const chunkData: Record<string, unknown> = {
  "player-details": { name: "Tester", powerLevel: 100 },
  characters: [{ unitId: "ultraTigurius", rank: "Gold1" }],
  mows: [],
  "inventory-upgrades": [{ upgradeId: "u1", amount: 3 }],
  "inventory-items": [{ itemId: "i1", level: 1, amount: 2 }],
  inventory: { resetStones: 2 },
  "campaign-progress": [{ tacticusCampaignId: "campaign1", type: "Standard" }],
  "campaign-events-progress": [],
  "live-progress": {
    battleAttempts: [],
    activeCampaignEventId: null,
    gameModeTokens: {
      arena: null,
      guildRaid: null,
      onslaught: null,
      salvageRun: null,
    },
  },
  "lre-progress": [],
}

function createManifest(
  hashes: Record<string, string> = {}
): PlayerDataManifest {
  return {
    schemaVersion: 1,
    gameConfigHash: "config-hash-1",
    sourceHash: `source-${Object.values(hashes).join("-") || "base"}`,
    syncedAt: "2026-07-06T00:00:00Z",
    chunks: playerDataChunkKeys.map((key) => ({
      key,
      hash: hashes[key] ?? `${key}-h1`,
      url: `/api/v1/me/player-data/${key}`,
    })),
  }
}

class FakePlayerDataClient implements PlayerDataClient {
  readonly downloaded: string[] = []

  constructor(
    private readonly manifest: PlayerDataManifest,
    private readonly dataOverride: Record<string, unknown> = {},
    private readonly failKeys: ReadonlySet<string> = new Set()
  ) {}

  triggerSync(): Promise<PlayerDataManifest> {
    return Promise.resolve(this.manifest)
  }

  getManifest(): Promise<PlayerDataManifestResult> {
    return Promise.resolve({
      status: "ok",
      etag: null,
      manifest: this.manifest,
    })
  }

  getChunk(chunk: PlayerDataManifestChunk): Promise<PlayerDataChunkEnvelope> {
    if (this.failKeys.has(chunk.key)) {
      return Promise.reject(new Error(`boom for ${chunk.key}`))
    }

    this.downloaded.push(chunk.key)

    return Promise.resolve({
      schemaVersion: this.manifest.schemaVersion,
      gameConfigHash: this.manifest.gameConfigHash,
      sourceHash: this.manifest.sourceHash,
      chunkKey: chunk.key,
      chunkHash: chunk.hash,
      data: this.dataOverride[chunk.key] ?? chunkData[chunk.key],
    })
  }
}

function resetDb() {
  return new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(playerDataDbName)

    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

// Reproduces the same class of bug @workspace/game-catalog's storage layer guards against: a chunk
// key added to `playerDataChunkKeys` without a matching `playerDataDbVersion` bump, so an existing
// client's DB — already at the current version — never gets an `upgradeneeded` and is left without
// that store.
function seedDbMissingStore(missingKey: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(playerDataDbName, playerDataDbVersion)

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore("metadata", { keyPath: "key" })

      for (const key of playerDataChunkKeys) {
        if (key === missingKey) {
          continue
        }

        if (isSplitPlayerDataChunkKey(key)) {
          db.createObjectStore(key, { keyPath: splitChunkKeyPath[key] })
        } else {
          db.createObjectStore(key)
        }
      }
    }

    request.onsuccess = () => {
      request.result.close()
      resolve()
    }
    request.onerror = () => reject(request.error as Error)
  })
}

beforeEach(resetDb)

describe("syncPlayerData", () => {
  it("downloads every chunk on first sync and stores each payload", async () => {
    const client = new FakePlayerDataClient(createManifest())

    const result = await syncPlayerData(client)

    expect(result.status).toBe("ready")
    expect(result.firstTime).toBe(true)
    expect(result.syncedAt).toBe("2026-07-06T00:00:00Z")
    expect(result.downloaded.sort()).toEqual([...playerDataChunkKeys].sort())
    expect(await hasCompletePlayerDataCache()).toBe(true)

    const characters = await getChunkData("characters")
    expect(characters).toEqual([{ unitId: "ultraTigurius", rank: "Gold1" }])

    const inventory = await getChunkData("inventory")
    expect(inventory).toEqual({ resetStones: 2 })
  })

  it("treats an unchanged manifest as ready and a later sync as not first-time", async () => {
    await syncPlayerData(new FakePlayerDataClient(createManifest()))

    const client = new FakePlayerDataClient(createManifest())
    const result = await syncPlayerData(client)

    expect(result.status).toBe("ready")
    expect(result.firstTime).toBe(false)
    expect(client.downloaded).toEqual([])
  })

  it("only downloads chunks whose hash changed", async () => {
    await syncPlayerData(new FakePlayerDataClient(createManifest()))

    const client = new FakePlayerDataClient(
      createManifest({ "inventory-items": "inventory-items-h2" })
    )
    const result = await syncPlayerData(client)

    expect(client.downloaded).toEqual(["inventory-items"])
    expect(result.downloaded).toEqual(["inventory-items"])
    expect(result.status).toBe("ready")
  })

  it("replaces a changed chunk's stored payload", async () => {
    await syncPlayerData(new FakePlayerDataClient(createManifest()))
    expect(await getChunkData("characters")).toEqual([
      { unitId: "ultraTigurius", rank: "Gold1" },
    ])

    const client = new FakePlayerDataClient(
      createManifest({ characters: "characters-h2" }),
      { characters: [{ unitId: "necroWarden", rank: "Bronze1" }] }
    )
    await syncPlayerData(client)

    expect(await getChunkData("characters")).toEqual([
      { unitId: "necroWarden", rank: "Bronze1" },
    ])
  })

  it("surfaces an error naming a failed chunk without wedging the cache", async () => {
    const client = new FakePlayerDataClient(
      createManifest(),
      {},
      new Set(["mows"])
    )

    await expect(syncPlayerData(client)).rejects.toThrow(/mows/)

    // The failed chunk is incomplete (so a retry re-selects it); the others still landed.
    expect(await hasCompletePlayerDataCache()).toBe(false)
    expect(await getChunkData("mows")).toBeUndefined()
    expect(await getChunkData("characters")).toEqual([
      { unitId: "ultraTigurius", rank: "Gold1" },
    ])
  })

  it("self-heals a store missing at the current DB version instead of wedging the sync", async () => {
    await seedDbMissingStore("lre-progress")

    const result = await syncPlayerData(
      new FakePlayerDataClient(createManifest())
    )

    expect(result.status).toBe("ready")
    expect(await hasCompletePlayerDataCache()).toBe(true)
    expect(await getChunkData("lre-progress")).toEqual([])
  })

  it("reads a single record from a split chunk by its natural id, without loading the whole chunk", async () => {
    await syncPlayerData(new FakePlayerDataClient(createManifest()))

    expect(await getChunkRecord("characters", "ultraTigurius")).toEqual({
      unitId: "ultraTigurius",
      rank: "Gold1",
    })
    expect(await getChunkRecord("characters", "necroWarden")).toBeUndefined()

    // campaign-progress has no single natural id field — it's keyed by the
    // [tacticusCampaignId, type] pair instead.
    expect(
      await getChunkRecord("campaign-progress", ["campaign1", "Standard"])
    ).toEqual({ tacticusCampaignId: "campaign1", type: "Standard" })
  })
})
