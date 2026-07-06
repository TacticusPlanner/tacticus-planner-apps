import { beforeEach, describe, expect, it } from "vitest"

import type {
  PlayerDataClient,
  PlayerDataManifestResult,
} from "./player-data-api"
import { getChunkData, hasCompletePlayerDataCache } from "./player-data-storage"
import { syncPlayerData } from "./player-data-sync"
import {
  playerDataChunkKeys,
  type PlayerDataChunkEnvelope,
  type PlayerDataManifest,
  type PlayerDataManifestChunk,
} from "./types"

// The fake client bypasses zod (the real PlayerDataHttpClient validates); these payloads only need the
// shape the storage layer stores verbatim, not the full served schema.
const chunkData: Record<string, unknown> = {
  "player-details": { name: "Tester", powerLevel: 100 },
  characters: [{ unitId: "ultraTigurius", name: "Tigurius", rank: 12 }],
  mows: [],
  "inventory-upgrades": [{ upgradeId: "u1", name: "Health", amount: 3 }],
  "inventory-items": [
    { itemId: "i1", name: "Crit Booster", level: 1, amount: 2 },
  ],
  inventory: { resetStones: 2 },
  "campaign-progress": [
    { tacticusCampaignId: "campaign1", catalogCampaignGroupId: "campaign1" },
  ],
  "campaign-events-progress": [],
  "game-mode-tokens": {
    arena: null,
    guildRaid: null,
    onslaught: null,
    salvageRun: null,
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
    const request = indexedDB.deleteDatabase("player-data")

    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
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
    expect(characters).toEqual([
      { unitId: "ultraTigurius", name: "Tigurius", rank: 12 },
    ])

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
      { unitId: "ultraTigurius", name: "Tigurius", rank: 12 },
    ])

    const client = new FakePlayerDataClient(
      createManifest({ characters: "characters-h2" }),
      { characters: [{ unitId: "necroWarden", name: "Warden", rank: 5 }] }
    )
    await syncPlayerData(client)

    expect(await getChunkData("characters")).toEqual([
      { unitId: "necroWarden", name: "Warden", rank: 5 },
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
      { unitId: "ultraTigurius", name: "Tigurius", rank: 12 },
    ])
  })
})
