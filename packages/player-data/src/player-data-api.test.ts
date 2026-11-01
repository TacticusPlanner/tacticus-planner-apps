import { afterEach, describe, expect, it, vi } from "vitest"

import { PlayerDataHttpClient } from "./player-data-api"

const base = "https://api.example.test"
const mowsChunk = { key: "mows", hash: "h1", url: "/api/v1/player-data/mows" }
const manifest = {
  schemaVersion: 1,
  gameConfigHash: "config-1",
  sourceHash: "source-1",
  syncedAt: "2026-07-06T00:00:00Z",
  chunks: [mowsChunk],
}

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    gameConfigHash: "config-1",
    sourceHash: "source-1",
    chunkKey: "mows",
    chunkHash: "h1",
    data: [],
    ...overrides,
  }
}

function respondWith(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

function createClient() {
  return new PlayerDataHttpClient(base, async () => "token")
}

describe("PlayerDataHttpClient", () => {
  afterEach(() => vi.restoreAllMocks())

  it("triggers a sync on the player-data sync route with a bearer token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 503 }))
    const client = new PlayerDataHttpClient(
      "https://api.example.test",
      async () => "token"
    )

    await expect(client.triggerSync()).rejects.toThrow("status 503")

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe("https://api.example.test/api/v1/player-data/sync")
    expect(init?.method).toBe("POST")
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token")
  })

  it("never sends the token to a chunk URL on another origin", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    const getAccessToken = vi.fn(async () => "token")
    const client = new PlayerDataHttpClient(
      "https://api.example.test",
      getAccessToken
    )

    await expect(
      client.getChunk({
        key: "characters",
        hash: "h1",
        url: "https://evil.example.test/api/v1/player-data/characters",
      })
    ).rejects.toThrow("evil.example.test")

    expect(getAccessToken).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("requires a non-empty base URL", () => {
    expect(() => new PlayerDataHttpClient("  ", async () => "token")).toThrow(
      "non-empty base URL"
    )
  })

  it("returns the validated sync manifest", async () => {
    respondWith(manifest)

    await expect(createClient().triggerSync()).resolves.toEqual(manifest)
  })

  it("rejects a sync manifest that fails validation", async () => {
    respondWith({ ...manifest, chunks: "nope" })

    await expect(createClient().triggerSync()).rejects.toThrow(
      "sync response failed validation"
    )
  })

  it("fetches a chunk from its manifest URL with a bearer token and returns the validated envelope", async () => {
    const fetchMock = respondWith(envelope())

    await expect(createClient().getChunk(mowsChunk)).resolves.toEqual(
      envelope()
    )

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe("https://api.example.test/api/v1/player-data/mows")
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token")
  })

  it("rejects a chunk request that fails", async () => {
    respondWith({}, 404)

    await expect(createClient().getChunk(mowsChunk)).rejects.toThrow(
      "chunk 'mows' request failed with status 404"
    )
  })

  it("rejects a chunk envelope that fails validation", async () => {
    respondWith({ data: [] })

    await expect(createClient().getChunk(mowsChunk)).rejects.toThrow(
      "chunk 'mows' envelope failed validation"
    )
  })

  it("rejects a chunk envelope for a different key than requested", async () => {
    respondWith(envelope({ chunkKey: "characters" }))

    await expect(createClient().getChunk(mowsChunk)).rejects.toThrow(
      "key 'characters' did not match requested key 'mows'"
    )
  })

  it("rejects a chunk key the client does not know", async () => {
    respondWith(envelope({ chunkKey: "mystery" }))

    await expect(
      createClient().getChunk({ ...mowsChunk, key: "mystery" })
    ).rejects.toThrow("chunk 'mystery' is not a known chunk")
  })

  it("rejects a chunk payload that fails its key's schema", async () => {
    respondWith(envelope({ data: { not: "an array" } }))

    await expect(createClient().getChunk(mowsChunk)).rejects.toThrow(
      "chunk 'mows' failed validation"
    )
  })
})
