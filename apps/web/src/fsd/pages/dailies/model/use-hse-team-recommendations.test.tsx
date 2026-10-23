import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { hseInstance } from "@/test/fixtures/hse-render"
import {
  useFixtureHseProjection,
  type HseFixtureReads,
} from "@/test/fixtures/hse-event-points"
import { hseTeamsFixtureRead } from "@/test/fixtures/hse-teams"
import { unitPowerCatalog } from "@/test/fixtures/unit-power"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"
import type { HseInstance } from "@/features/home-screen-event-points"

import { useHseTeamRecommendations } from "./use-hse-team-recommendations"

function renderTeams(
  instance: HseInstance | null,
  reads: HseFixtureReads = {}
) {
  return renderHook(() =>
    useHseTeamRecommendations(
      instance,
      useFixtureHseProjection(instance, reads)
    )
  )
}

/** Seeds the fixture roster and its catalog characters. The `unit-power` record is seeded too:
 * without it the power context waits for a catalog manifest the seed helpers do not write. */
async function seedRoster() {
  const read = hseTeamsFixtureRead()
  if (read.status !== "ready") throw new Error("fixture read is not ready")
  await seedPlayerData({ characters: read.roster })
  await seedGameCatalog({
    // No rank-up data: power is unavailable, as with the old unit-power stub.
    characters: [...read.catalog].map(([id, view]) => ({
      id,
      ...view,
      rankUpUpgrades: [],
    })),
    "unit-power": [unitPowerCatalog.unitPower],
  })
}

beforeEach(async () => {
  await seedRoster()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useHseTeamRecommendations", () => {
  it("builds the teams of an upcoming personal event from the roster", async () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") return
    expect(
      result.current.recommendations.modes.map((entry) => entry.teams.length)
    ).toEqual([1, 3, 3])
  })

  it("builds them for a running event too", async () => {
    const { result } = renderTeams(
      hseInstance("hse-for-the-emperor", "running")
    )
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("is loading while the roster has not resolved", () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )
    expect(result.current.status).toBe("loading")
  })

  it("is loading while the event scoring loads", async () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming"),
      { catalog: () => undefined }
    )
    // Let the roster read resolve, so only the scoring keeps the teams loading.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(result.current.status).toBe("loading")
  })

  it("reports a failed roster read with a retry that reads again", async () => {
    // IndexedDB fails every store read until the retry.
    const getAll = vi
      .spyOn(IDBObjectStore.prototype, "getAll")
      .mockImplementation(() => {
        throw new DOMException("Read failed", "UnknownError")
      })
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )

    await waitFor(() => expect(result.current.status).toBe("error"))
    getAll.mockRestore()
    act(() => {
      if (result.current.status === "error") result.current.retry()
    })
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("is hidden for a past event", () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-flying", "past")
    )
    expect(result.current.status).toBe("hidden")
  })

  it("is hidden for a Global event", () => {
    const { result } = renderTeams(
      hseInstance("hse-global-operation-imperator", "upcoming")
    )
    expect(result.current.status).toBe("hidden")
  })

  it("is hidden for an event without scoring data (Against the Tide)", () => {
    const { result } = renderTeams(
      hseInstance("hse-against-the-tide", "upcoming")
    )
    expect(result.current.status).toBe("hidden")
  })

  it("is hidden when the event scoring cannot be read", () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming"),
      { catalog: () => ({ status: "error" }) }
    )
    expect(result.current.status).toBe("hidden")
  })

  it("is hidden for an event scoring in no token mode (Arsenal of War) and with no instance", () => {
    expect(
      renderTeams(hseInstance("hse-arsenal-of-war", "running")).result.current
        .status
    ).toBe("hidden")
    expect(renderTeams(null).result.current.status).toBe("hidden")
  })

  it("still builds teams when the synced token buckets are not unlocked", async () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming"),
      {
        player: () => ({
          status: "ready",
          player: { powerLevel: 62, hasBlueStarUnit: true },
          buckets: { Arena: null, Onslaught: null, SalvageRun: null },
          observedAtMs: null,
        }),
      }
    )
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })
})
