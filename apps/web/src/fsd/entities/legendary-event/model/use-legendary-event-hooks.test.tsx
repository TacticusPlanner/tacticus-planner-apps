import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useClearEstimateConfig } from "./use-clear-estimate-config"
import { useLegendaryEvent } from "./use-legendary-event"
import { useLegendaryEventBattles } from "./use-legendary-event-battles"
import { useLegendaryEventCommon } from "./use-legendary-event-common"
import { useLegendaryEventProgress } from "./use-legendary-event-progress"
import { useLegendaryEventSyncTimes } from "./use-legendary-event-sync-times"
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
  catalogSynced: true,
  metadata: new Map<string, { updatedAt: string }>(),
  clearEstimate: null as null | Record<string, unknown>,
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
  getLegendaryEventBattles: (id: string) =>
    read(
      id === "votanUthar"
        ? [{ id: "votanUthar-alpha-1", lreId: "votanUthar", power: 1018 }]
        : []
    ),
  getLegendaryEventClearEstimate: () => read(store.clearEstimate),
  hasLegendaryEventsSynced: async () => store.catalogSynced,
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLegendaryEventsProgress: () => read(undefined),
  getLegendaryEventProgress: (id: string) =>
    read(id === progress.id ? progress : undefined),
}))
vi.mock("@workspace/player-data", () => ({
  getPlayerDataMetadata: () => read(store.metadata),
  getManifestMetadata: (metadata: Map<string, unknown>) =>
    metadata.get("player-data-manifest"),
}))

describe("Legendary Event read hooks", () => {
  beforeEach(() => {
    store.fail = false
    store.pending = false
    store.calls = 0
    store.catalogSynced = true
    store.metadata = new Map()
    store.clearEstimate = null
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
    expect(known.result.current.catalogSynced).toBe(true)

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

  it("reads one event's battles", async () => {
    const { result } = renderHook(() => useLegendaryEventBattles("votanUthar"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      data: [{ id: "votanUthar-alpha-1", power: 1018 }],
    })
  })

  it("reads the clear-estimate config as loading, absent, ready or failed", async () => {
    store.pending = true
    const loading = renderHook(() => useClearEstimateConfig())
    expect(loading.result.current.status).toBe("loading")
    store.pending = false

    const absent = renderHook(() => useClearEstimateConfig())
    await waitFor(() => expect(absent.result.current.status).toBe("absent"))

    store.clearEstimate = {
      id: "lre-clear-estimate",
      powerRatio: 0.5,
      calibration: { sampleCount: 0, calibratedOn: null },
      unitCoefficients: [{ unitId: "ultraTigurius", coefficient: 1.2 }],
    }
    const ready = renderHook(() => useClearEstimateConfig())
    await waitFor(() => expect(ready.result.current.status).toBe("ready"))
    const state = ready.result.current
    if (state.status !== "ready") throw new Error("not ready")
    expect(state.config.powerRatio).toBe(0.5)
    expect(state.config.calibrated).toBe(false)
    expect(state.config.coefficients.get("ultraTigurius")).toBe(1.2)

    store.fail = true
    const failed = renderHook(() => useClearEstimateConfig())
    await waitFor(() => expect(failed.result.current.status).toBe("failed"))
  })

  it("reports a progress read failure", async () => {
    store.fail = true
    const { result } = renderHook(() => useLegendaryEventsProgress())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("reports whether the catalog has synced for an absent event", async () => {
    store.catalogSynced = false
    const { result } = renderHook(() => useLegendaryEvent("astarLysander"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.catalogSynced).toBe(false)
  })

  it("reads the sync and progress-observation instants", async () => {
    store.metadata = new Map([
      ["player-data-manifest", { updatedAt: "2026-09-02T11:35:00Z" }],
      ["lre-progress", { updatedAt: "2026-09-02T11:34:00Z" }],
    ])
    const { result } = renderHook(() => useLegendaryEventSyncTimes())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      data: {
        syncedAtMs: Date.parse("2026-09-02T11:35:00Z"),
        progressObservedAtMs: Date.parse("2026-09-02T11:34:00Z"),
      },
    })
  })

  it("reads null sync times before the first sync, and an error on a failed read", async () => {
    const empty = renderHook(() => useLegendaryEventSyncTimes())
    await waitFor(() => expect(empty.result.current.status).toBe("ready"))
    expect(empty.result.current).toMatchObject({
      data: { syncedAtMs: null, progressObservedAtMs: null },
    })

    store.fail = true
    const failed = renderHook(() => useLegendaryEventSyncTimes())
    await waitFor(() => expect(failed.result.current.status).toBe("error"))
  })
})
