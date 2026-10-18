import { useEffect, useState } from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { hseDefinitionConfig } from "@/test/fixtures/home-screen-event-scoring"

import type { HseInstance } from "./hse-event-points"
import { useHseProjection } from "./use-hse-projection"

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

const reads = vi.hoisted(() => ({
  catalogFails: false,
  playerFails: false,
  definitions: [] as { id: string; type: string; config: unknown }[],
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getEventDefinitions: async () => {
    if (reads.catalogFails) throw new Error("boom")
    return reads.definitions
  },
}))

const HOUR_S = 3600
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerDetails: async () => {
    if (reads.playerFails) throw new Error("boom")
    return { name: "Player", powerLevel: 62 }
  },
  getPlayerCharacters: async () => [
    { unitId: "bloodMephiston", progressionIndex: "Legendary:OneBlueStar" },
  ],
  getPlayerMows: async () => [],
  getLiveProgress: async () => ({
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
  }),
}))
vi.mock("@workspace/player-data", () => ({
  getPlayerDataMetadata: async () =>
    new Map([["live-progress", { updatedAt: "2026-10-21T08:00:00Z" }]]),
}))

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

beforeEach(() => {
  window.localStorage.clear()
  reads.catalogFails = false
  reads.playerFails = false
  reads.definitions = [
    definition(
      "hse-trait-boost-psyker",
      hseDefinitionConfig("hse-trait-boost-psyker")
    ),
    definition(
      "hse-global-operation-imperator",
      hseDefinitionConfig("hse-global-operation-imperator")
    ),
    definition("hse-against-the-tide"),
  ]
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

  it("has nothing for no instance", async () => {
    const { result } = renderHook(() => useHseProjection(null))
    expect(result.current.status).toBe("none")
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
    reads.catalogFails = true
    expect(
      (await settle(instance("hse-trait-boost-psyker", "running"))).status
    ).toBe("error")
  })

  it("keeps the details and fails only the projection when the player data cannot be read", async () => {
    reads.playerFails = true
    const state = await settle(instance("hse-trait-boost-psyker", "running"))
    if (state.status !== "ready") throw new Error(state.status)
    expect(state.details.playerTier).toBeNull()
    expect(state.details.tier.tier).toBe("High")
    expect(state.projection).toEqual({ status: "error" })
  })
})
