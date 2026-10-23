import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useNpcsById } from "./use-npcs-by-id"

beforeEach(async () => {
  await seedGameCatalog({ npcs: [{ id: "orksNpc1Grot" }] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Fails every read of the `npcs` store until the returned spy is restored.
function failNpcReads() {
  const getAll = IDBObjectStore.prototype.getAll
  return vi
    .spyOn(IDBObjectStore.prototype, "getAll")
    .mockImplementation(function (this: IDBObjectStore, ...args) {
      if (this.name === "npcs") throw new Error("boom")
      return getAll.apply(this, args)
    })
}

describe("useNpcsById", () => {
  it("is loading until the read settles", () => {
    const { result } = renderHook(() => useNpcsById())
    expect(result.current.status).toBe("loading")
  })

  it("is ready with the NPCs by id", async () => {
    const { result } = renderHook(() => useNpcsById())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" &&
        result.current.data.has("orksNpc1Grot")
    ).toBe(true)
  })

  it("reports a failed read and retries it", async () => {
    const failing = failNpcReads()
    const { result } = renderHook(() => useNpcsById())
    await waitFor(() => expect(result.current.status).toBe("error"))

    failing.mockRestore()
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })
})
