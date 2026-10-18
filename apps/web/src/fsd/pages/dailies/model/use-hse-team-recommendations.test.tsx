import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { hseInstance } from "@/test/fixtures/hse-render"
import {
  useFixtureHseProjection,
  type HseFixtureReads,
} from "@/test/fixtures/hse-event-points"
import { hseTeamsFixtureRead } from "@/test/fixtures/hse-teams"
import type { HseInstance } from "@/features/home-screen-event-points"

import type { HseTeamsRead } from "./hse-teams-view-model"
import { useHseTeamRecommendations } from "./use-hse-team-recommendations"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    read: undefined as unknown,
    deps: [] as unknown[][],
  },
}))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (_querier: unknown, deps: unknown[]) => {
    mocks.deps.push(deps)
    return mocks.read
  },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: vi.fn(),
}))
vi.mock("./use-team-unit-power", () => ({
  useTeamUnitPower: () => ({ loading: false, unitPower: null }),
}))

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

beforeEach(() => {
  window.localStorage.clear()
  mocks.read = hseTeamsFixtureRead()
  mocks.deps.length = 0
})

describe("useHseTeamRecommendations", () => {
  it("builds the teams of an upcoming personal event from the roster", () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )

    expect(result.current.status).toBe("ready")
    if (result.current.status !== "ready") return
    expect(
      result.current.recommendations.modes.map((entry) => entry.teams.length)
    ).toEqual([1, 3, 3])
  })

  it("builds them for a running event too", () => {
    const { result } = renderTeams(
      hseInstance("hse-for-the-emperor", "running")
    )
    expect(result.current.status).toBe("ready")
  })

  it("is loading while the roster has not resolved", () => {
    mocks.read = undefined
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )
    expect(result.current.status).toBe("loading")
  })

  it("is loading while the event scoring loads", () => {
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming"),
      { catalog: () => undefined }
    )
    expect(result.current.status).toBe("loading")
  })

  it("reports a failed roster read with a retry that reads again", () => {
    mocks.read = { status: "error" } satisfies HseTeamsRead
    const { result } = renderTeams(
      hseInstance("hse-trait-boost-psyker", "upcoming")
    )

    expect(result.current.status).toBe("error")
    if (result.current.status !== "error") return
    const before = mocks.deps.at(-1)
    act(() => {
      if (result.current.status === "error") result.current.retry()
    })
    expect(mocks.deps.at(-1)).not.toEqual(before)
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

  it("still builds teams when the synced token buckets are not unlocked", () => {
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
    expect(result.current.status).toBe("ready")
  })
})
