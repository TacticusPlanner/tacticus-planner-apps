import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { replacePlayerDataChunk } from "@workspace/player-data/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { usePlayerDataStatus } from "@/shared/player-data-status"
import { setTestAuth } from "@/test/auth"
import { act, renderHook, waitFor } from "@/test/render"

const sync = vi.hoisted(() => ({
  run: vi.fn(),
  refresh: vi.fn(async () => {}),
}))

// Kept (targeted): these tests are about what the provider does around `syncPlayerData`, so the
// sync itself (a network round-trip) is the one export replaced; the metadata reads stay real.
vi.mock("@workspace/player-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/player-data")>()),
  syncPlayerData: sync.run,
}))
vi.mock("@/features/player-data-sync", () => ({
  refreshServerReadsAfterSync: sync.refresh,
}))

import { PlayerDataProvider } from "./player-data-provider"

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <PlayerDataProvider baseUrl="https://api.test">
        {children}
      </PlayerDataProvider>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  setTestAuth({ authenticated: true })
  // Synced a minute ago: no background sync on mount.
  await replacePlayerDataChunk(
    "player-details",
    { name: "Tester" },
    {
      key: "__manifest" as never,
      hash: "manifest-test",
      schemaVersion: 1,
      updatedAt: new Date(Date.now() - 60_000).toISOString(),
    }
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("PlayerDataProvider", () => {
  it("refreshes the server reads (run records, plans, goals) once a sync completes, not before", async () => {
    let finish!: (value: unknown) => void
    sync.run.mockReturnValueOnce(new Promise((done) => (finish = done)))
    const { result } = renderHook(() => usePlayerDataStatus(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("ready"))

    act(() => result.current.syncNow())
    await waitFor(() => expect(result.current.status).toBe("syncing"))
    expect(sync.refresh).not.toHaveBeenCalled()

    await act(async () =>
      finish({ status: "ready", syncedAt: new Date().toISOString() })
    )
    await waitFor(() => expect(sync.refresh).toHaveBeenCalledOnce())
  })

  it("does not refresh after a failed sync", async () => {
    sync.refresh.mockClear()
    vi.spyOn(console, "error").mockImplementation(() => {})
    sync.run.mockRejectedValueOnce(new Error("boom"))
    const { result } = renderHook(() => usePlayerDataStatus(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe("ready"))

    act(() => result.current.syncNow())
    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(sync.refresh).not.toHaveBeenCalled()
  })

  describe("when a background check fails outside the sync", () => {
    afterEach(() => vi.useRealTimers())

    it("reports it and keeps checking on the interval", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const log = vi.spyOn(console, "error").mockImplementation(() => {})
      // The first metadata read fails (as if IndexedDB closed); later ones read the real store.
      const getAll = IDBObjectStore.prototype.getAll
      let metadataReads = 0
      vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(function (
        this: IDBObjectStore,
        ...args
      ) {
        if (this.name === "metadata" && metadataReads++ === 0) {
          throw new Error("indexeddb closed")
        }
        return getAll.apply(this, args)
      })
      renderHook(() => usePlayerDataStatus(), { wrapper })

      await waitFor(() =>
        expect(log).toHaveBeenCalledWith(
          "Unhandled error (player-data sync)",
          expect.objectContaining({ message: "indexeddb closed" })
        )
      )
      await act(() => vi.advanceTimersByTimeAsync(10 * 60 * 1000))

      await waitFor(() => expect(metadataReads).toBeGreaterThan(1))
    })
  })
})
