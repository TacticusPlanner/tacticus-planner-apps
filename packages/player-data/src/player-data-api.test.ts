import { afterEach, describe, expect, it, vi } from "vitest"

import { PlayerDataHttpClient } from "./player-data-api"

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
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/me/player-data/sync"
    )
    expect(init?.method).toBe("POST")
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token")
  })
})
