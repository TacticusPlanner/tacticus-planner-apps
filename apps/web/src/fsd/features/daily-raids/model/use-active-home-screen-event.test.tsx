import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteGameCatalogDatabase } from "@workspace/game-catalog/testing"

import { refreshLocalDataAfterSync } from "@/shared/local-data"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useActiveHomeScreenEvent } from "./use-active-home-screen-event"

const definitions = [
  { id: "hse-machine-hunt", type: "HomeScreenEvent" },
  { id: "hse-training-rush", type: "HomeScreenEvent" },
]

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

/** The events-calendar payload: date-indexed, one entry list per start date. */
function calendar(entries: { startUtc: string }[]) {
  const byDate: Record<string, unknown[]> = {}
  for (const entry of entries) {
    ;(byDate[entry.startUtc.slice(0, 10)] ??= []).push(entry)
  }
  return byDate
}

function seedCalendar(entries: { startUtc: string }[]) {
  return seedGameCatalog({
    "event-definitions": definitions,
    "events-calendar": calendar(entries),
  })
}

describe("useActiveHomeScreenEvent", () => {
  beforeEach(async () => {
    await seedCalendar([hunt, rush])
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

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
    // The horizon is [2025-08-27T08:00Z, 2027-11-05T08:00Z): entries 1 ms inside each bound are
    // read, entries touching a bound from outside are not.
    const endsAtStart = {
      definitionId: "hse-training-rush",
      startUtc: "2025-08-20T08:00:00Z",
      endUtc: "2025-08-27T08:00:00.000Z",
    }
    const endsInsideStart = {
      definitionId: "hse-machine-hunt",
      startUtc: "2025-08-21T08:00:00Z",
      endUtc: "2025-08-27T08:00:00.001Z",
    }
    const startsInsideEnd = {
      definitionId: "hse-machine-hunt",
      startUtc: "2027-11-05T07:59:59.999Z",
      endUtc: "2027-11-08T08:00:00Z",
    }
    const startsAtEnd = {
      definitionId: "hse-training-rush",
      startUtc: "2027-11-05T08:00:00.000Z",
      endUtc: "2027-11-09T08:00:00Z",
    }
    await seedCalendar([
      rush,
      pastHunt,
      hunt,
      endsAtStart,
      endsInsideStart,
      startsInsideEnd,
      startsAtEnd,
    ])
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await waitFor(() => expect(result.current.status).toBe("ready"))

    expect(result.current).toMatchObject({
      active: null,
      next: hunt,
      instances: [
        {
          key: "hse-machine-hunt@2025-08-21T08:00:00Z",
          entry: endsInsideStart,
          status: "past",
        },
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
        {
          key: "hse-machine-hunt@2027-11-05T07:59:59.999Z",
          entry: startsInsideEnd,
          status: "upcoming",
        },
      ],
    })
  })

  it("moves an instance from running to past on the tick, keeping its key", async () => {
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval"],
      shouldAdvanceTime: true,
    })
    vi.setSystemTime(new Date("2026-10-06T07:59:00Z"))
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    const key = "hse-machine-hunt@2026-10-02T08:00:00Z"
    const huntInstance = () =>
      result.current.status === "ready"
        ? result.current.instances.find((instance) => instance.key === key)
        : undefined
    await waitFor(() => expect(huntInstance()?.status).toBe("running"))

    vi.setSystemTime(new Date("2026-10-06T08:00:30Z"))
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    await waitFor(() => expect(huntInstance()?.status).toBe("past"))
    expect(result.current).toMatchObject({ active: null, next: rush })
  })

  it("stays loading until the calendar has synced, so a shared key is not judged stale", async () => {
    // Calendar rows are present but the definitions it is read with have not synced yet.
    await deleteGameCatalogDatabase()
    await seedGameCatalog({ "events-calendar": calendar([hunt, rush]) })
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval"],
      shouldAdvanceTime: true,
    })
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"))
    const { result, queryClient } = renderHook(() => useActiveHomeScreenEvent())
    await act(() => vi.advanceTimersByTimeAsync(0))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current).toEqual({ status: "loading" })

    // The sync that writes the definitions refreshes what it wrote.
    await act(() => seedGameCatalog({ "event-definitions": definitions }))
    refreshLocalDataAfterSync(queryClient, "catalog", ["event-definitions"])
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: "ready", next: hunt })
    )
  })

  it("reports an error when the calendar read fails", async () => {
    // Fail the IndexedDB table read itself; the synced-metadata probe uses `get` and still works.
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(() => {
      throw new Error("boom")
    })
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("re-selects across an event boundary on the tick", async () => {
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval"],
      shouldAdvanceTime: true,
    })
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"))
    const { result } = renderHook(() => useActiveHomeScreenEvent())
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: "ready", active: null })
    )

    vi.setSystemTime(new Date("2026-10-02T08:00:30Z"))
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    await waitFor(() =>
      expect(result.current).toMatchObject({ active: hunt, upcoming: [rush] })
    )
  })
})
