import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useNpcsById } from "./use-npcs-by-id"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const store = vi.hoisted(() => ({ fail: false, pending: false }))

vi.mock("@workspace/game-catalog/queries", () => ({
  getNpcsMap: () => {
    if (store.pending) return new Promise(() => {})
    return store.fail
      ? Promise.reject(new Error("boom"))
      : Promise.resolve(new Map([["orksNpc1Grot", { id: "orksNpc1Grot" }]]))
  },
}))

beforeEach(() => {
  store.fail = false
  store.pending = false
})

describe("useNpcsById", () => {
  it("is loading until the read settles", () => {
    store.pending = true
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
    store.fail = true
    const { result } = renderHook(() => useNpcsById())
    await waitFor(() => expect(result.current.status).toBe("error"))

    store.fail = false
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })
})
