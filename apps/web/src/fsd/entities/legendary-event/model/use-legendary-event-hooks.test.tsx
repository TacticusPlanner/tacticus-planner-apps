import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLegendaryEvent } from "./use-legendary-event"
import { useLegendaryEventCommon } from "./use-legendary-event-common"
import { useLegendaryEventProgress } from "./use-legendary-event-progress"
import { useLegendaryEvents } from "./use-legendary-events"
import { useLegendaryEventsProgress } from "./use-legendary-events-progress"

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

const store = vi.hoisted(() => ({
  fail: false,
  pending: false,
  calls: 0,
}))
const lysander = {
  id: "astarLysander",
  name: "Lysander",
  finished: false,
  eventStageStartDatesUtc: ["2026-08-30T00:00:00Z"],
}
const progress = { id: "astarLysander", currentPoints: 3410 }

function read<T>(value: T): Promise<T> {
  store.calls += 1
  if (store.pending) return new Promise(() => {})
  return store.fail ? Promise.reject(new Error("boom")) : Promise.resolve(value)
}

vi.mock("@workspace/game-catalog/queries", () => ({
  getLegendaryEvents: () => read([lysander]),
  getLegendaryEvent: (id: string) =>
    read(id === lysander.id ? lysander : undefined),
  getLegendaryEventCommon: () => read(null),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLegendaryEventsProgress: () => read(undefined),
  getLegendaryEventProgress: (id: string) =>
    read(id === progress.id ? progress : undefined),
}))

describe("Legendary Event read hooks", () => {
  beforeEach(() => {
    store.fail = false
    store.pending = false
    store.calls = 0
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })

  it("starts loading", () => {
    store.pending = true
    const { result } = renderHook(() => useLegendaryEvents())
    expect(result.current.status).toBe("loading")
  })

  it("is ready with the catalog events and the evaluation instant", async () => {
    const { result } = renderHook(() => useLegendaryEvents())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      data: [lysander],
      nowMs: Date.parse("2026-09-02T12:00:00Z"),
    })
  })

  it("reports an error and re-issues the read on retry", async () => {
    store.fail = true
    const { result } = renderHook(() => useLegendaryEvents())
    await waitFor(() => expect(result.current.status).toBe("error"))
    const callsBefore = store.calls

    store.fail = false
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(store.calls).toBeGreaterThan(callsBefore)
  })

  it("derives the lifecycle of one event and reads an unknown id as undefined", async () => {
    const known = renderHook(() => useLegendaryEvent("astarLysander"))
    await waitFor(() => expect(known.result.current.status).toBe("ready"))
    expect(known.result.current.lifecycle).toMatchObject({ state: "active" })

    const unknown = renderHook(() => useLegendaryEvent("notAnEvent"))
    await waitFor(() => expect(unknown.result.current.status).toBe("ready"))
    expect(unknown.result.current).toMatchObject({
      data: undefined,
      lifecycle: undefined,
    })
  })

  it("reads progress, mapping a never-synced chunk to no entries", async () => {
    const all = renderHook(() => useLegendaryEventsProgress())
    await waitFor(() => expect(all.result.current.status).toBe("ready"))
    expect(all.result.current).toMatchObject({ data: [] })

    const one = renderHook(() => useLegendaryEventProgress("astarLysander"))
    await waitFor(() => expect(one.result.current.status).toBe("ready"))
    expect(one.result.current).toMatchObject({ data: progress })
  })

  it("reads the reward ladder as null before it syncs", async () => {
    const { result } = renderHook(() => useLegendaryEventCommon())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({ data: null })
  })

  it("reports a progress read failure", async () => {
    store.fail = true
    const { result } = renderHook(() => useLegendaryEventsProgress())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })
})
