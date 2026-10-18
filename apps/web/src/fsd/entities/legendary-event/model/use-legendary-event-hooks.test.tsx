import { useEffect, useState } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUnitPowerContext } from "@/shared/unit-power"

import { CLEAR_ESTIMATE_POWER_RATIO } from "../lib/clear-estimate"
import { useClearEstimateConfig } from "./use-clear-estimate-config"
import { useLegendaryEvent } from "./use-legendary-event"
import { useLegendaryEventBattles } from "./use-legendary-event-battles"
import { useLegendaryEventProgress } from "./use-legendary-event-progress"
import { useLegendaryEventSyncTimes } from "./use-legendary-event-sync-times"
import { useLegendaryEvents } from "./use-legendary-events"
import { useLegendaryEventsBattles } from "./use-legendary-events-battles"
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
  hordeModeTiers: null as null | Record<string, unknown>,
  unitPower: { status: "ready", data: null, retry: () => {} } as
    | { status: "loading" | "error"; retry: () => void }
    | { status: "ready"; data: unknown; retry: () => void },
  battleReads: [] as string[][],
}))
const lysander = {
  id: "astarLysander",
  name: "Lysander",
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
  getLegendaryEventBattles: (id: string) =>
    read(
      id === "votanUthar"
        ? [{ id: "votanUthar-alpha-1", lreId: "votanUthar", power: 1018 }]
        : []
    ),
  getLegendaryEventsBattles: (ids: readonly string[]) => {
    store.battleReads.push([...ids])
    return read(
      Object.fromEntries(
        ids.map((id) => [
          id,
          id === "votanUthar"
            ? [{ id: "votanUthar-alpha-1", lreId: "votanUthar", power: 1018 }]
            : [],
        ])
      )
    )
  },
  getHordeModeTiers: () => read(store.hordeModeTiers),
  hasLegendaryEventsSynced: async () => store.catalogSynced,
}))
vi.mock("@/shared/unit-power", () => ({
  useUnitPowerContext: () => store.unitPower,
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
    store.hordeModeTiers = null
    store.unitPower = { status: "ready", data: null, retry: () => {} }
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

  it("reads several events' battles in one grouped read", async () => {
    store.battleReads = []
    const { result } = renderHook(() =>
      useLegendaryEventsBattles(["votanUthar", "astarLysander"])
    )
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      data: {
        votanUthar: [{ id: "votanUthar-alpha-1", power: 1018 }],
        astarLysander: [],
      },
    })
    expect(store.battleReads).toEqual([["votanUthar", "astarLysander"]])
  })

  it("reads one event's battles", async () => {
    const { result } = renderHook(() => useLegendaryEventBattles("votanUthar"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      data: [{ id: "votanUthar-alpha-1", power: 1018 }],
    })
  })

  it("reads the clear-estimate config as loading, ready or failed", async () => {
    store.pending = true
    const loading = renderHook(() =>
      useClearEstimateConfig(useUnitPowerContext())
    )
    expect(loading.result.current.status).toBe("loading")
    store.pending = false

    // No tier list synced: estimates still show, every character untiered.
    const untiered = renderHook(() =>
      useClearEstimateConfig(useUnitPowerContext())
    )
    await waitFor(() => expect(untiered.result.current.status).toBe("ready"))
    const untieredState = untiered.result.current
    if (untieredState.status !== "ready") throw new Error("not ready")
    expect(untieredState.config.hordeMultipliers.size).toBe(0)
    // No unit-power dataset: the config is ready, with no power context (no estimate shows).
    expect(untieredState.config.unitPower).toBeNull()

    const context = { tables: "unit-power" }
    store.unitPower = { status: "ready", data: context, retry: () => {} }

    store.hordeModeTiers = {
      id: "horde-mode-tiers",
      tiers: [{ tier: "A", multiplier: 1.55 }],
      characters: [
        { unitId: "ultraTigurius", tier: "A" },
        { unitId: "ultraCalgar", tier: "A", multiplier: 1.65 },
      ],
    }
    const ready = renderHook(() =>
      useClearEstimateConfig(useUnitPowerContext())
    )
    await waitFor(() => expect(ready.result.current.status).toBe("ready"))
    const state = ready.result.current
    if (state.status !== "ready") throw new Error("not ready")
    expect(state.config.powerRatio).toBe(CLEAR_ESTIMATE_POWER_RATIO)
    expect(state.config.calibrated).toBe(false)
    expect(state.config.hordeMultipliers.get("ultraTigurius")).toBe(1.55)
    expect(state.config.hordeMultipliers.get("ultraCalgar")).toBe(1.65)
    expect(state.config.unitPower).toBe(context)

    store.fail = true
    const failed = renderHook(() =>
      useClearEstimateConfig(useUnitPowerContext())
    )
    await waitFor(() => expect(failed.result.current.status).toBe("failed"))
  })

  it("waits for the power context and fails when it cannot be read", async () => {
    store.unitPower = { status: "loading", retry: () => {} }
    const loading = renderHook(() =>
      useClearEstimateConfig(useUnitPowerContext())
    )
    await waitFor(() => expect(store.calls).toBeGreaterThan(0))
    expect(loading.result.current.status).toBe("loading")

    const retry = vi.fn()
    store.unitPower = { status: "error", retry }
    const failed = renderHook(() =>
      useClearEstimateConfig(useUnitPowerContext())
    )
    await waitFor(() => expect(failed.result.current.status).toBe("failed"))
    const state = failed.result.current
    if (state.status !== "failed") throw new Error("not failed")
    act(() => state.retry())
    expect(retry).toHaveBeenCalledOnce()
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
