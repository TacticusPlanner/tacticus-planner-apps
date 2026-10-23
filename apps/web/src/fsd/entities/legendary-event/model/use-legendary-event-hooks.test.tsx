import { act, renderHook, waitFor } from "@/test/render"
import { playerDataManifestMetadataKey } from "@workspace/player-data"
import { replacePlayerDataChunk } from "@workspace/player-data/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { UnitPowerContext } from "@/shared/unit-power"
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import {
  resetTestDatabases,
  seedGameCatalog,
  seedPlayerData,
} from "@/test/seed"

import { CLEAR_ESTIMATE_POWER_RATIO } from "../lib/clear-estimate"
import { useClearEstimateConfig } from "./use-clear-estimate-config"
import { useHordeModeTiers } from "./use-horde-mode-tiers"
import { useLegendaryEvent } from "./use-legendary-event"
import { useLegendaryEventBattles } from "./use-legendary-event-battles"
import { useLegendaryEventProgress } from "./use-legendary-event-progress"
import { useLegendaryEventSyncTimes } from "./use-legendary-event-sync-times"
import { useLegendaryEvents } from "./use-legendary-events"
import { useLegendaryEventsBattles } from "./use-legendary-events-battles"
import { useLegendaryEventsProgress } from "./use-legendary-events-progress"

const lysander = {
  id: "astarLysander",
  name: "Lysander",
  eventStageStartDatesUtc: ["2026-08-30T00:00:00Z"],
}
const progress = { id: "astarLysander", currentPoints: 3410 }
const utharBattle = {
  id: "votanUthar-alpha-1",
  lreId: "votanUthar",
  power: 1018,
}

function readyPower(data: UnitPowerContext | null) {
  return { status: "ready", data, retry: () => {} } as const
}

let reads: ReturnType<typeof spyOnIndexedDbReads>

describe("Legendary Event read hooks", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
    await seedGameCatalog({ lres: [lysander], "lre-battles": [utharBattle] })
    await seedPlayerData({ "lre-progress": [progress] })
    reads = spyOnIndexedDbReads()
  })

  afterEach(() => {
    reads.restore()
    vi.useRealTimers()
  })

  it("starts loading", () => {
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
    reads.fail()
    const { result } = renderHook(() => useLegendaryEvents())
    await waitFor(() => expect(result.current.status).toBe("error"))
    const callsBefore = reads.calls()

    reads.fail(false)
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(reads.calls()).toBeGreaterThan(callsBefore)
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
    const one = renderHook(() => useLegendaryEventProgress("astarLysander"))
    await waitFor(() => expect(one.result.current.status).toBe("ready"))
    expect(one.result.current).toMatchObject({ data: progress })
    one.unmount()

    await resetTestDatabases()
    const all = renderHook(() => useLegendaryEventsProgress())
    await waitFor(() => expect(all.result.current.status).toBe("ready"))
    expect(all.result.current).toMatchObject({ data: [] })
  })

  it("reads several events' battles in one grouped read", async () => {
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
    // One read of the battles store serves both events.
    const battleStoreReads = vi
      .mocked(IDBObjectStore.prototype.getAll)
      .mock.contexts.filter(
        (store) => (store as IDBObjectStore).name === "lre-battles"
      )
    expect(battleStoreReads).toHaveLength(1)
  })

  it("reads one event's battles", async () => {
    const { result } = renderHook(() => useLegendaryEventBattles("votanUthar"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({
      data: [{ id: "votanUthar-alpha-1", power: 1018 }],
    })
  })

  it("reads the clear-estimate config as loading, ready or failed", async () => {
    const context = { tables: "unit-power" } as unknown as UnitPowerContext
    const power = readyPower(context)

    // Failed first: Dexie's live-query cache would answer a tier read made earlier in the test.
    reads.fail()
    const failed = renderHook(() => useClearEstimateConfig(power))
    await waitFor(() => expect(failed.result.current.status).toBe("failed"))
    failed.unmount()
    reads.fail(false)

    const noPower = readyPower(null)
    const loading = renderHook(() => useClearEstimateConfig(noPower))
    expect(loading.result.current.status).toBe("loading")

    // No tier list synced: estimates still show, every character untiered.
    const untiered = renderHook(() => useClearEstimateConfig(noPower))
    await waitFor(() => expect(untiered.result.current.status).toBe("ready"))
    const untieredState = untiered.result.current
    if (untieredState.status !== "ready") throw new Error("not ready")
    expect(untieredState.config.hordeMultipliers.size).toBe(0)
    // No unit-power dataset: the config is ready, with no power context (no estimate shows).
    expect(untieredState.config.unitPower).toBeNull()

    await seedGameCatalog({
      "horde-mode-tiers": [
        {
          id: "horde-mode-tiers",
          tiers: [{ tier: "A", multiplier: 1.55 }],
          characters: [
            { unitId: "ultraTigurius", tier: "A" },
            { unitId: "ultraCalgar", tier: "A", multiplier: 1.65 },
          ],
        },
      ],
    })
    const ready = renderHook(() => useClearEstimateConfig(power))
    await waitFor(() => expect(ready.result.current.status).toBe("ready"))
    const state = ready.result.current
    if (state.status !== "ready") throw new Error("not ready")
    expect(state.config.powerRatio).toBe(CLEAR_ESTIMATE_POWER_RATIO)
    expect(state.config.calibrated).toBe(false)
    expect(state.config.hordeMultipliers.get("ultraTigurius")).toBe(1.55)
    expect(state.config.hordeMultipliers.get("ultraCalgar")).toBe(1.65)
    expect(state.config.unitPower).toBe(context)
  })

  it("waits for the power context and fails when it cannot be read", async () => {
    const powerLoading = { status: "loading", retry: () => {} } as const
    const loading = renderHook(() => ({
      tiers: useHordeModeTiers(),
      config: useClearEstimateConfig(powerLoading),
    }))
    // The tier list has been read; the config still waits for the power context.
    await waitFor(() =>
      expect(loading.result.current.tiers.status).toBe("ready")
    )
    expect(reads.calls()).toBeGreaterThan(0)
    expect(loading.result.current.config.status).toBe("loading")

    const retry = vi.fn()
    const powerFailed = { status: "error", retry } as const
    const failed = renderHook(() => useClearEstimateConfig(powerFailed))
    await waitFor(() => expect(failed.result.current.status).toBe("failed"))
    const state = failed.result.current
    if (state.status !== "failed") throw new Error("not failed")
    act(() => state.retry())
    expect(retry).toHaveBeenCalledOnce()
  })

  it("reports a progress read failure", async () => {
    reads.fail()
    const { result } = renderHook(() => useLegendaryEventsProgress())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("reports whether the catalog has synced for an absent event", async () => {
    await resetTestDatabases()
    const { result } = renderHook(() => useLegendaryEvent("astarLysander"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current).toMatchObject({ data: undefined })
    expect(result.current.catalogSynced).toBe(false)
  })

  it("reads the sync and progress-observation instants", async () => {
    // A real sync writes the manifest row; replacePlayerDataChunk writes whichever metadata row it
    // is handed, so it stands in for that here.
    await replacePlayerDataChunk("lre-progress", [progress], {
      key: playerDataManifestMetadataKey,
      hash: "manifest-test",
      schemaVersion: 1,
      updatedAt: "2026-09-02T11:35:00Z",
    })
    await replacePlayerDataChunk("lre-progress", [progress], {
      key: "lre-progress",
      hash: "lre-progress-test",
      schemaVersion: 1,
      updatedAt: "2026-09-02T11:34:00Z",
    })
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
    await resetTestDatabases()
    // Failed first: Dexie's live-query cache would answer a metadata read made earlier in the test.
    reads.fail()
    const failed = renderHook(() => useLegendaryEventSyncTimes())
    await waitFor(() => expect(failed.result.current.status).toBe("error"))
    failed.unmount()
    reads.fail(false)

    const empty = renderHook(() => useLegendaryEventSyncTimes())
    await waitFor(() => expect(empty.result.current.status).toBe("ready"))
    expect(empty.result.current).toMatchObject({
      data: { syncedAtMs: null, progressObservedAtMs: null },
    })
  })
})
