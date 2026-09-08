import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  useArenaRecommendations,
  usePersistedArenaMode,
} from "./use-arena-recommendations"

type QueryResult = {
  data: unknown
  isError: boolean
  isPending: boolean
  refetch: () => void
}

const makeResult = (over: Partial<QueryResult> = {}): QueryResult => ({
  data: { goals: [] },
  isError: false,
  isPending: false,
  refetch: vi.fn(),
  ...over,
})

let projectsState: {
  activeProjectId: string | undefined
  fetchState: { status: string }
  loading: boolean
  retry: () => void
}
let goalsResult: QueryResult
let projectGoalsResult: QueryResult
let rosterState: unknown

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("dexie-react-hooks", () => ({ useLiveQuery: () => rosterState }))
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: readonly unknown[] }) =>
    options.queryKey[0] === "goals" ? goalsResult : projectGoalsResult,
}))
vi.mock("@/entities/goal", () => ({
  goalQueries: {
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
    }),
  },
}))
vi.mock("@/entities/project", () => ({
  useProjects: () => projectsState,
  projectQueries: {
    goals: (projectId: string) => ({
      queryKey: ["projects", "detail", projectId, "goals"],
    }),
  },
}))

const character = (unitId: string, over: Record<string, unknown> = {}) => ({
  unitId,
  rank: "Stone1",
  progressionIndex: "Common:None",
  xpLevel: 3,
  appliedUpgradeSlots: [],
  abilities: [{ level: 1 }, { level: 1 }],
  ...over,
})

beforeEach(() => {
  projectsState = {
    activeProjectId: undefined,
    fetchState: { status: "success" },
    loading: false,
    retry: vi.fn(),
  }
  goalsResult = makeResult()
  projectGoalsResult = makeResult()
  rosterState = [character("a"), character("b"), character("c")]
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("usePersistedArenaMode", () => {
  it("defaults to XP Mode with nothing stored", () => {
    const { result } = renderHook(() => usePersistedArenaMode())
    expect(result.current[0]).toBe("xp")
  })

  it("round-trips a chosen mode through localStorage", () => {
    const first = renderHook(() => usePersistedArenaMode())
    act(() => first.result.current[1]("power"))
    expect(first.result.current[0]).toBe("power")
    expect(window.localStorage.getItem("tp.dailies.arena.mode")).toBe("power")

    const second = renderHook(() => usePersistedArenaMode())
    expect(second.result.current[0]).toBe("power")
  })

  it("falls back to XP Mode when localStorage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => usePersistedArenaMode())
    expect(result.current[0]).toBe("xp")
    expect(() => act(() => result.current[1]("power"))).not.toThrow()
    expect(result.current[0]).toBe("power")
  })
})

describe("useArenaRecommendations", () => {
  it("reports loading while the roster has not resolved", () => {
    rosterState = undefined
    const { result } = renderHook(() => useArenaRecommendations())
    expect(result.current.status).toBe("loading")
  })

  it("reports a retryable error when a data source fails", () => {
    goalsResult = makeResult({ isError: true })
    const { result } = renderHook(() => useArenaRecommendations())
    const vm = result.current
    expect(vm.status).toBe("error")
    if (vm.status !== "error") return
    act(() => vm.retry())
    expect(goalsResult.refetch).toHaveBeenCalled()
    expect(projectsState.retry).toHaveBeenCalled()
  })

  it("reports no-characters when fewer than three characters are owned", () => {
    rosterState = [character("a"), character("b")]
    const { result } = renderHook(() => useArenaRecommendations())
    expect(result.current.status).toBe("no-characters")
  })

  it("does not wait on the project-goals query when there is no active project", () => {
    projectGoalsResult = makeResult({ isPending: true })
    const { result } = renderHook(() => useArenaRecommendations())
    expect(result.current.status).toBe("ready")
  })

  it("returns the three categories and regenerate touches only the random team", () => {
    goalsResult = makeResult({
      data: {
        goals: [
          {
            goalId: "g1",
            entityType: "Character",
            entityId: "a",
            status: "Active",
          },
          {
            goalId: "g2",
            entityType: "Character",
            entityId: "b",
            status: "Active",
          },
        ],
      },
    })
    rosterState = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    const { result } = renderHook(() => useArenaRecommendations())
    expect(result.current.status).toBe("ready")
    if (result.current.status !== "ready") return

    const ids = result.current.recommendations.categories.map((c) => c.id)
    expect(ids).toEqual(["active-project", "overall-goals", "random"])

    const overallBefore = JSON.stringify(
      result.current.recommendations.categories.find(
        (c) => c.id === "overall-goals"
      )
    )
    const randomBefore = JSON.stringify(
      result.current.recommendations.categories.find((c) => c.id === "random")
    )

    act(() => {
      if (result.current.status === "ready") result.current.regenerate()
    })

    if (result.current.status !== "ready") return
    const overallAfter = JSON.stringify(
      result.current.recommendations.categories.find(
        (c) => c.id === "overall-goals"
      )
    )
    const randomAfter = JSON.stringify(
      result.current.recommendations.categories.find((c) => c.id === "random")
    )
    expect(overallAfter).toBe(overallBefore)
    expect(randomAfter).not.toBe(randomBefore)
  })
})
