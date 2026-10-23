import { describe, expect, it, vi } from "vitest"

import {
  ManifestSyncError,
  mapWithConcurrency,
  runManifestSync,
} from "./manifest-sync"

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => (resolve = done))
  return { promise, resolve }
}

const keys = Array.from({ length: 10 }, (_, index) => `d${index}`)

describe("mapWithConcurrency", () => {
  it("keeps at most `limit` workers pending and returns results in input order", async () => {
    let pending = 0
    let peak = 0
    const results = await mapWithConcurrency(keys, 4, async (key) => {
      pending++
      peak = Math.max(peak, pending)
      await new Promise((resolve) => setTimeout(resolve, 1))
      pending--
      return key.toUpperCase()
    })

    expect(peak).toBe(4)
    expect(results).toEqual(keys.map((key) => key.toUpperCase()))
  })

  it("returns an empty list for no items", async () => {
    expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([])
  })
})

describe("runManifestSync", () => {
  it("downloads every item with at most 4 in flight and reports 10 of 10", async () => {
    let pending = 0
    let peak = 0
    const onProgress = vi.fn()
    const finalize = vi.fn(async () => ["withdrawn"])

    const result = await runManifestSync({
      items: keys,
      keyOf: (key) => key,
      download: async () => {
        pending++
        peak = Math.max(peak, pending)
        await new Promise((resolve) => setTimeout(resolve, 1))
        pending--
      },
      finalize,
      label: "catalog dataset",
      onProgress,
    })

    expect(peak).toBeLessThanOrEqual(4)
    expect(result.downloaded.toSorted()).toEqual(keys.toSorted())
    expect(result.removed).toEqual(["withdrawn"])
    expect(finalize).toHaveBeenCalledOnce()
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ downloaded: 10, total: 10 })
    )
  })

  it("stores the other items, rejects once after all settled naming the failure, and does not finalize", async () => {
    const items = keys.slice(0, 6)
    const slow = deferred()
    const finalize = vi.fn(async () => [])
    const run = runManifestSync({
      items,
      keyOf: (key) => key,
      download: async (key) => {
        if (key === "d1") throw new Error("boom")
        if (key === "d5") await slow.promise
      },
      finalize,
      label: "player-data chunk",
    })
    const settled = vi.fn()
    void run.catch(settled)

    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(settled).not.toHaveBeenCalled()
    slow.resolve()

    const error = await run.catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ManifestSyncError)
    expect((error as Error).message).toBe(
      "Failed to sync 1 player-data chunk(s) — d1: boom"
    )
    expect((error as ManifestSyncError<string>).downloaded.toSorted()).toEqual([
      "d0",
      "d2",
      "d3",
      "d4",
      "d5",
    ])
    expect(finalize).not.toHaveBeenCalled()
  })

  it("finalizes with nothing downloaded when no item changed", async () => {
    const result = await runManifestSync({
      items: [],
      keyOf: (key: string) => key,
      download: vi.fn(),
      finalize: async () => [],
      label: "catalog dataset",
    })

    expect(result).toEqual({ downloaded: [], removed: [] })
  })
})
