import type { UnitId } from "@workspace/game-domain"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  useArenaRecommendations,
  usePersistedArenaMode,
  usePersistedTeamSize,
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

const uid = (value: string) => value as UnitId

beforeEach(() => {
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

describe("usePersistedTeamSize", () => {
  it("defaults to a five-character team with nothing stored", () => {
    const { result } = renderHook(() => usePersistedTeamSize())
    expect(result.current[0]).toBe(5)
  })

  it("round-trips a chosen size through localStorage", () => {
    const first = renderHook(() => usePersistedTeamSize())
    act(() => first.result.current[1](3))
    expect(first.result.current[0]).toBe(3)
    expect(window.localStorage.getItem("tp.dailies.arena.teamSize")).toBe("3")

    const second = renderHook(() => usePersistedTeamSize())
    expect(second.result.current[0]).toBe(3)
  })

  it("ignores an out-of-range stored value", () => {
    window.localStorage.setItem("tp.dailies.arena.teamSize", "9")
    const { result } = renderHook(() => usePersistedTeamSize())
    expect(result.current[0]).toBe(5)
  })
})

describe("useArenaRecommendations", () => {
  it("reports loading while the roster has not resolved", () => {
    rosterState = undefined
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("reports a retryable error when a data source fails", () => {
    goalsResult = makeResult({ isError: true })
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    const vm = result.current
    expect(vm.status).toBe("error")
    if (vm.status !== "error") return
    act(() => vm.retry())
    expect(goalsResult.refetch).toHaveBeenCalled()
  })

  it("reports no-characters when fewer than three characters are owned", () => {
    rosterState = [character("a"), character("b")]
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    expect(result.current.status).toBe("no-characters")
  })

  it("does not wait on the project-goals query when no project is selected", () => {
    projectGoalsResult = makeResult({ isPending: true })
    const { result } = renderHook(() => useArenaRecommendations(undefined))
    expect(result.current.status).toBe("ready")
  })

  it("exposes only the sizes the roster can deliver", () => {
    rosterState = Array.from({ length: 4 }, (_, index) =>
      character(`u${index}`)
    )
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.availableSizes).toEqual([3, 4])
  })

  it("returns the plan and random categories; regenerate touches only the random team", () => {
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
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    expect(result.current.status).toBe("ready")
    if (result.current.status !== "ready") return

    expect(result.current.recommendations.categories.map((c) => c.id)).toEqual([
      "plan",
      "random",
    ])

    const planBefore = JSON.stringify(
      result.current.recommendations.categories.find((c) => c.id === "plan")
    )
    const randomBefore = JSON.stringify(
      result.current.recommendations.categories.find((c) => c.id === "random")
    )

    act(() => {
      if (result.current.status === "ready") result.current.regenerate()
    })

    if (result.current.status !== "ready") return
    const planAfter = JSON.stringify(
      result.current.recommendations.categories.find((c) => c.id === "plan")
    )
    const randomAfter = JSON.stringify(
      result.current.recommendations.categories.find((c) => c.id === "random")
    )
    expect(planAfter).toBe(planBefore)
    expect(randomAfter).not.toBe(randomBefore)
  })

  it("keeps a locked random character across regenerate", () => {
    rosterState = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")

    const firstRandom = result.current.recommendations.categories.find(
      (c) => c.id === "random"
    )!
    const target = firstRandom.members[0].unitId

    act(() => {
      if (result.current.status === "ready")
        result.current.toggleRandomLock(target)
    })
    for (let i = 0; i < 4; i++) {
      act(() => {
        if (result.current.status === "ready") result.current.regenerate()
      })
      if (result.current.status !== "ready") throw new Error("expected ready")
      const random = result.current.recommendations.categories.find(
        (c) => c.id === "random"
      )!
      expect(random.members.map((m) => m.unitId)).toContain(target)
      expect(random.members.find((m) => m.unitId === target)?.locked).toBe(true)
    }

    act(() => {
      if (result.current.status === "ready")
        result.current.toggleRandomLock(target)
    })
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.lockedRandomUnitIds).not.toContain(target)
  })

  it("caps locks at the current team size", () => {
    rosterState = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")

    act(() => {
      if (result.current.status !== "ready") return
      for (let i = 0; i < 8; i++) result.current.toggleRandomLock(uid(`u${i}`))
    })
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.lockedRandomUnitIds).toHaveLength(5)
  })
})
