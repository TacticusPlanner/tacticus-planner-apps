import { replacePlayerDataChunk } from "@workspace/player-data/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { hseDefinitionConfig } from "@/test/fixtures/home-screen-event-scoring"
import { renderHook, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import type { HseInstance } from "./hse-event-points"
import { useHseProjection } from "./use-hse-projection"

const HOUR_S = 3600

// Counts reads per IndexedDB store ("<database>/<store>") and fails the stores listed in `failing`.
const idb = vi.hoisted(() => ({
  reads: new Map<string, number>(),
  failing: new Set<string>(),
}))

function spyOnStoreReads() {
  const getAll = IDBObjectStore.prototype.getAll
  vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(function (
    this: IDBObjectStore,
    ...args
  ) {
    const store = `${this.transaction.db.name.replace("tacticus-planner-", "")}/${this.name}`
    idb.reads.set(store, (idb.reads.get(store) ?? 0) + 1)
    if (idb.failing.has(store)) throw new Error("boom")
    return getAll.apply(this, args)
  })
}

async function seedPlayer() {
  await seedPlayerData({
    "player-details": { name: "Player", powerLevel: 62 },
    characters: [
      { unitId: "bloodMephiston", progressionIndex: "Legendary:OneBlueStar" },
    ],
    mows: [],
  })
  await replacePlayerDataChunk(
    "live-progress",
    {
      gameModeTokens: {
        arena: {
          current: 4,
          max: 10,
          nextTokenInSeconds: 1 * HOUR_S,
          regenDelayInSeconds: 2 * HOUR_S,
        },
        onslaught: null,
        salvageRun: {
          current: 2,
          max: 2,
          nextTokenInSeconds: 8 * HOUR_S,
          regenDelayInSeconds: 8 * HOUR_S,
        },
        guildRaid: null,
      },
    },
    {
      key: "live-progress",
      hash: "live-progress-test",
      schemaVersion: 1,
      updatedAt: "2026-10-21T08:00:00Z",
    }
  )
}

const definition = (id: string, config: unknown = null) => ({
  id,
  type: "HomeScreenEvent",
  config,
})

const instance = (
  definitionId: string,
  status: HseInstance["status"]
): HseInstance => ({
  key: `occ-${definitionId}`,
  status,
  entry: {
    definitionId,
    startUtc: "2026-10-19T08:00:00Z",
    endUtc: "2026-10-23T08:00:00Z",
    parameters: null,
  },
})

beforeEach(async () => {
  idb.reads.clear()
  idb.failing.clear()
  await seedPlayer()
  await seedGameCatalog({
    "event-definitions": [
      definition(
        "hse-trait-boost-psyker",
        hseDefinitionConfig("hse-trait-boost-psyker")
      ),
      definition(
        "hse-global-operation-imperator",
        hseDefinitionConfig("hse-global-operation-imperator")
      ),
      definition("hse-against-the-tide"),
    ],
  })
  spyOnStoreReads()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const settle = async (target: HseInstance | null) => {
  const hook = renderHook(() => useHseProjection(target))
  await waitFor(() => expect(hook.result.current.status).not.toBe("loading"))
  return hook.result.current
}

describe("useHseProjection", () => {
  it("is loading until the catalog and the player data are read", () => {
    const { result } = renderHook(() =>
      useHseProjection(instance("hse-trait-boost-psyker", "running"))
    )
    expect(result.current).toEqual({
      status: "loading",
      projectionPending: true,
    })
  })

  it("has nothing for no instance, reading the shared definitions at most once", async () => {
    const { result } = renderHook(() => useHseProjection(null))
    expect(result.current.status).toBe("none")
    await waitFor(() => expect(result.current.status).toBe("none"))
    // The definitions are one cached dataset the HSE tab reads anyway, not a per-event read.
    expect(
      idb.reads.get("game-catalog/event-definitions") ?? 0
    ).toBeLessThanOrEqual(1)
  })

  it("shows the new event's data, never the previous event's, right after the selection changes", async () => {
    const hook = renderHook(
      ({ target }: { target: HseInstance }) => useHseProjection(target),
      {
        initialProps: {
          target: instance("hse-trait-boost-psyker", "running"),
        },
      }
    )
    await waitFor(() => expect(hook.result.current.status).toBe("ready"))

    hook.rerender({
      target: instance("hse-global-operation-imperator", "running"),
    })
    // The new definition is selected from the cached dataset in the same render.
    const state = hook.result.current
    if (state.status !== "ready") throw new Error(state.status)
    expect(state.details.definitionId).toBe("hse-global-operation-imperator")
    expect(state.details.scope).toBe("Global")
  })

  it("projects a running personal event from the synced buckets, tier and roster", async () => {
    const state = await settle(instance("hse-trait-boost-psyker", "running"))

    if (state.status !== "ready") throw new Error(state.status)
    expect(state.details.playerTier).toBe("High")
    expect(state.details.powerLevel).toBe(62)
    expect(state.details.description).toHaveLength(3)
    if (state.projection.status !== "ready")
      throw new Error(state.projection.status)
    // Synced 48 hours before the end: Arena 4 + 1 + 23, Salvage Run 2 + 1 + 5; Onslaught locked.
    expect(
      state.projection.projection.modes.map((mode) => [mode.mode, mode.tokens])
    ).toEqual([
      ["Arena", 28],
      ["SalvageRun", 8],
    ])
    expect(state.projection.projection.lockedModes).toEqual(["Onslaught"])
    expect(state.projection.observedAtMs).toBe(
      Date.parse("2026-10-21T08:00:00Z")
    )
  })

  it("keeps a past instance's details without a projection", async () => {
    const state = await settle(instance("hse-trait-boost-psyker", "past"))
    expect(state.status).toBe("ready")
    if (state.status === "ready")
      expect(state.projection).toEqual({ status: "hidden" })
  })

  it("does not project a Global event", async () => {
    const state = await settle(
      instance("hse-global-operation-imperator", "running")
    )
    if (state.status !== "ready") throw new Error(state.status)
    expect(state.details.scope).toBe("Global")
    expect(state.projection).toEqual({ status: "hidden" })
  })

  it("has no data for a definition without config.hse or unknown to the catalog", async () => {
    expect(
      (await settle(instance("hse-against-the-tide", "running"))).status
    ).toBe("no-data")
    expect((await settle(instance("hse-unknown", "running"))).status).toBe(
      "no-data"
    )
  })

  it("fails when the catalog cannot be read", async () => {
    idb.failing.add("game-catalog/event-definitions")
    expect(
      (await settle(instance("hse-trait-boost-psyker", "running"))).status
    ).toBe("error")
  })

  it("keeps the details and fails only the projection when the player data cannot be read", async () => {
    idb.failing.add("player-data/characters")
    const state = await settle(instance("hse-trait-boost-psyker", "running"))
    if (state.status !== "ready") throw new Error(state.status)
    expect(state.details.playerTier).toBeNull()
    expect(state.details.tier.tier).toBe("High")
    expect(state.projection).toEqual({ status: "error" })
  })
})
