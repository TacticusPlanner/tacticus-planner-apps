import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useActiveHomeScreenEvent } from "./use-active-home-screen-event"

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

const catalog = vi.hoisted(() => ({
  fail: false,
  entries: [] as { definitionId: string; startUtc: string; endUtc: string }[],
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getEventDefinitions: async () => {
    if (catalog.fail) throw new Error("boom")
    return [
      { id: "hse-machine-hunt", type: "HomeScreenEvent" },
      { id: "hse-training-rush", type: "HomeScreenEvent" },
    ]
  },
  getUpcomingEvents: async () => catalog.entries,
}))

const hunt = {
  definitionId: "hse-machine-hunt",
  startUtc: "2026-10-02T08:00:00Z",
  endUtc: "2026-10-06T08:00:00Z",
}
const rush = {
  definitionId: "hse-training-rush",
  startUtc: "2026-10-09T08:00:00Z",
  endUtc: "2026-10-12T08:00:00Z",
}

describe("useActiveHomeScreenEvent", () => {
  beforeEach(() => {
    catalog.fail = false
    catalog.entries = [hunt, rush]
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("starts loading, then is ready with the active, next and upcoming events", async () => {
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    expect(result.current).toEqual({ status: "loading" })
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      active: null,
      next: hunt,
      upcoming: [hunt, rush],
    })
  })

  it("reports an error when the calendar read fails", async () => {
    catalog.fail = true
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("re-selects across an event boundary on the tick", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"))
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current).toMatchObject({ status: "ready", active: null })

    vi.setSystemTime(new Date("2026-10-02T08:00:30Z"))
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(result.current).toMatchObject({ active: hunt, upcoming: [rush] })
  })
})
