import { afterEach, describe, expect, it, vi } from "vitest"

import { GameCatalogHttpClient } from "./game-catalog-api"
import type { GameCatalogManifestDataset } from "./types"

const charactersDataset: GameCatalogManifestDataset = {
  key: "characters",
  hash: "characters-h1",
  url: "/api/v1/game-catalog/characters",
}

const validCharacter = {
  id: "c1",
  name: "Apothecary",
  faction: "Ultramarines",
  alliance: "Imperial",
  health: 100,
  damage: 20,
  armour: 10,
  initialRarity: "Common",
  meleeDamage: "Physical",
  meleeHits: 3,
  movement: 4,
  traits: [],
  activeAbilityNames: [],
  passiveAbilityNames: [],
  equipmentSlots: [],
  icon: "i.png",
  roundIcon: "r.png",
  rankUpUpgrades: [],
  shardLocations: [],
  eligibleEquipment: [],
}

function envelope(data: unknown) {
  return {
    version: "dev-1",
    schemaVersion: 9,
    gameVersion: "1.40",
    sourceHash: "abc",
    datasetKey: "characters",
    datasetHash: "characters-h1",
    data,
  }
}

function stubFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })))
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("GameCatalogHttpClient", () => {
  it("returns typed, validated dataset data", async () => {
    stubFetch(envelope([validCharacter]))
    const client = new GameCatalogHttpClient("http://localhost")

    const result = await client.getDataset(charactersDataset)
    const characters = result.data as (typeof validCharacter)[]

    expect(characters[0]?.id).toBe("c1")
  })

  it("throws when a dataset payload fails validation", async () => {
    stubFetch(envelope([{ id: "c1" }]))
    const client = new GameCatalogHttpClient("http://localhost")

    await expect(client.getDataset(charactersDataset)).rejects.toThrow(
      /failed validation/
    )
  })

  it("throws when the response key does not match the request", async () => {
    stubFetch({ ...envelope([validCharacter]), datasetKey: "npcs" })
    const client = new GameCatalogHttpClient("http://localhost")

    await expect(client.getDataset(charactersDataset)).rejects.toThrow(
      /did not match/
    )
  })

  it("validates the manifest", async () => {
    stubFetch({
      version: "dev-1",
      schemaVersion: 9,
      gameVersion: "1.40",
      sourceHash: "abc",
      datasets: [charactersDataset],
    })
    const client = new GameCatalogHttpClient("http://localhost")

    const result = await client.getManifest()

    expect(result.status).toBe("ok")
  })
})
