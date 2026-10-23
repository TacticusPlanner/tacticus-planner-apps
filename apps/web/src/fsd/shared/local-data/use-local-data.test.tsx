import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { localReadTimeoutMs } from "@/shared/lib"
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import {
  listenForLocalDataRefresh,
  refreshLocalDataAfterSync,
  writtenKeys,
} from "./refresh-after-sync"
import { toById, useCatalogDataset, usePlayerChunk } from "./use-local-data"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  return { queryClient, wrapper: Wrapper }
}

const characters = [
  { id: "ultraCalgar", name: "Calgar" },
  { id: "necroWarden", name: "Warden" },
]

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("useCatalogDataset", () => {
  it("reads a dataset once for every mounted consumer", async () => {
    await seedGameCatalog({ characters })
    const reads = spyOnIndexedDbReads()
    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => [useCatalogDataset("characters"), useCatalogDataset("characters")],
      { wrapper }
    )

    await waitFor(() => expect(result.current[1]?.status).toBe("ready"))
    expect(reads.calls()).toBe(1)
  })

  it("keeps a selector's derived value referentially stable across re-renders", async () => {
    await seedGameCatalog({ characters })
    const { wrapper } = createWrapper()

    const { result, rerender } = renderHook(
      () => useCatalogDataset("characters", toById),
      { wrapper }
    )
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const first = result.current
    rerender()

    expect(result.current).toBe(first)
    expect(
      first.status === "ready" && first.data.get("ultraCalgar")?.name
    ).toBe("Calgar")
  })

  it("reports a read that never settles as an error after the timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(
      () => ({}) as IDBRequest
    )
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCatalogDataset("characters"), {
      wrapper,
    })
    expect(result.current.status).toBe("loading")

    await act(() => vi.advanceTimersByTimeAsync(localReadTimeoutMs))

    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("re-reads on retry and reaches ready", async () => {
    await seedGameCatalog({ characters })
    const reads = spyOnIndexedDbReads()
    reads.fail("characters")
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCatalogDataset("characters"), {
      wrapper,
    })
    await waitFor(() => expect(result.current.status).toBe("error"))

    reads.fail(false)
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).not.toBe("error"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })
})

describe("usePlayerChunk", () => {
  it("reads null before the chunk has synced, then the chunk", async () => {
    const { wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => usePlayerChunk("characters"), {
      wrapper,
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: "ready", data: null })
    )

    await seedPlayerData({ characters: [{ unitId: "ultraCalgar" }] })
    refreshLocalDataAfterSync(queryClient, "player", ["characters"])

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "ready",
        data: [{ unitId: "ultraCalgar" }],
      })
    )
  })
})

describe("refreshLocalDataAfterSync", () => {
  it("invalidates only the keys the sync wrote, plus composite reads", () => {
    const { queryClient } = createWrapper()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    refreshLocalDataAfterSync(queryClient, "catalog", ["characters"])

    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual(
      [
        ["local", "catalog", "characters"],
        ["local", "composite"],
      ]
    )
  })

  it("invalidates nothing and posts nothing when the sync wrote nothing", () => {
    const { queryClient } = createWrapper()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const post = vi.spyOn(BroadcastChannel.prototype, "postMessage")

    refreshLocalDataAfterSync(queryClient, "player", [])

    expect(invalidate).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it("refreshes the keys another tab posted", async () => {
    const { queryClient } = createWrapper()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const stop = listenForLocalDataRefresh(queryClient)
    const otherTab = new BroadcastChannel("tacticus-planner-local-data")

    otherTab.postMessage({ source: "catalog", keys: ["mows"] })

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["local", "catalog", "mows"],
      })
    )
    otherTab.close()
    stop()
  })
})

describe("writtenKeys", () => {
  it("lists downloaded and removed keys from a result or a partial-failure error", () => {
    expect(
      writtenKeys({ downloaded: ["characters"], removed: ["horde-mode-tiers"] })
    ).toEqual(["characters", "horde-mode-tiers"])
    expect(
      writtenKeys(Object.assign(new Error("partial"), { downloaded: ["mows"] }))
    ).toEqual(["mows"])
    expect(writtenKeys(new Error("network"))).toEqual([])
  })
})
