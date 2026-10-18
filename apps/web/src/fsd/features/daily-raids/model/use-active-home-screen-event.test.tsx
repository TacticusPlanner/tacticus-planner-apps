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
  synced: true,
  entries: [] as { definitionId: string; startUtc: string; endUtc: string }[],
  ranges: [] as [Date, Date][],
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  hasEventsCalendarSynced: async () => catalog.synced,
  getEventDefinitions: async () => {
    if (catalog.fail) throw new Error("boom")
    return [
      { id: "hse-machine-hunt", type: "HomeScreenEvent" },
      { id: "hse-training-rush", type: "HomeScreenEvent" },
    ]
  },
  getUpcomingEvents: async (start: Date, end: Date) => {
    catalog.ranges.push([start, end])
    return catalog.entries
  },
}))

const hunt = {
  definitionId: "hse-machine-hunt",
  startUtc: "2026-10-02T08:00:00Z",
  endUtc: "2026-10-06T08:00:00Z",
}
const pastHunt = {
  definitionId: "hse-machine-hunt",
  startUtc: "2026-09-20T08:00:00Z",
  endUtc: "2026-09-24T08:00:00Z",
}
const rush = {
  definitionId: "hse-training-rush",
  startUtc: "2026-10-09T08:00:00Z",
  endUtc: "2026-10-12T08:00:00Z",
}

describe("useActiveHomeScreenEvent", () => {
  beforeEach(() => {
    catalog.fail = false
    catalog.synced = true
    catalog.entries = [hunt, rush]
    catalog.ranges = []
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

  it("loads 400 days back and ahead and lists past instances too", async () => {
    catalog.entries = [rush, pastHunt, hunt]
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await waitFor(() => expect(result.current.status).toBe("ready"))

    const [start, end] = catalog.ranges.at(-1)!
    expect(start.toISOString()).toBe("2025-08-27T08:00:00.000Z")
    expect(end.toISOString()).toBe("2027-11-05T08:00:00.000Z")
    expect(result.current).toMatchObject({
      active: null,
      next: hunt,
      instances: [
        {
          key: "hse-machine-hunt@2026-09-20T08:00:00Z",
          entry: pastHunt,
          status: "past",
        },
        {
          key: "hse-machine-hunt@2026-10-02T08:00:00Z",
          entry: hunt,
          status: "upcoming",
        },
        {
          key: "hse-training-rush@2026-10-09T08:00:00Z",
          entry: rush,
          status: "upcoming",
        },
      ],
    })
  })

  it("moves an instance from running to past on the tick, keeping its key", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-10-06T07:59:00Z"))
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await act(() => vi.advanceTimersByTimeAsync(0))
    const key = "hse-machine-hunt@2026-10-02T08:00:00Z"
    const huntInstance = () =>
      result.current.status === "ready"
        ? result.current.instances.find((instance) => instance.key === key)
        : undefined
    expect(huntInstance()?.status).toBe("running")

    vi.setSystemTime(new Date("2026-10-06T08:00:30Z"))
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(huntInstance()?.status).toBe("past")
    expect(result.current).toMatchObject({ active: null, next: rush })
  })

  it("stays loading until the calendar has synced, so a shared key is not judged stale", async () => {
    catalog.synced = false
    catalog.entries = []
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"))
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current).toEqual({ status: "loading" })
    expect(catalog.ranges).toEqual([])

    catalog.synced = true
    catalog.entries = [hunt, rush]
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(result.current).toMatchObject({ status: "ready", next: hunt })
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
