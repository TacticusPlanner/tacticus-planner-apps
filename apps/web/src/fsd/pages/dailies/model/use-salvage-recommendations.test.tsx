import type { UnitId } from "@workspace/game-domain"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  usePersistedSalvageTrack,
  useSalvageRecommendations,
} from "./use-salvage-recommendations"

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
let catalogState: unknown

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: vi.fn(),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) =>
    querier.toString().includes("safeReadCatalog") ? catalogState : rosterState,
}))
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

const character = (unitId: string) => ({
  unitId,
  rank: "Stone1",
  progressionIndex: "Common:None",
  xpLevel: 3,
  appliedUpgradeSlots: [],
  abilities: [{ level: 1 }, { level: 1 }],
})

/** A catalog map covering the current `rosterState` ids. `alliances` assigns each id an alliance
 * (default Imperial); `traits` optionally sets per-id traits. */
const catalogMap = (
  alliances: Record<string, string> = {},
  traits: Record<string, string[]> = {}
) => {
  const state = rosterState
  const ids = Array.isArray(state)
    ? (state as { unitId: string }[]).map((c) => c.unitId)
    : []
  return new Map(
    ids.map((id) => [
      id,
      {
        id,
        alliance: alliances[id] ?? "Imperial",
        traits: traits[id] ?? [],
        meleeDamage: "Physical",
        rangedDamage: null,
        activeAbilityDamage: [],
        passiveAbilityDamage: [],
      },
    ])
  )
}

beforeEach(() => {
  goalsResult = makeResult()
  projectGoalsResult = makeResult()
  rosterState = [character("a"), character("b"), character("c")]
  catalogState = catalogMap()
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("usePersistedSalvageTrack", () => {
  it("defaults to the Imperial track with nothing stored", () => {
    const { result } = renderHook(() => usePersistedSalvageTrack())
    expect(result.current[0]).toBe("Imperial")
  })

  it("round-trips a chosen track through localStorage", () => {
    const first = renderHook(() => usePersistedSalvageTrack())
    act(() => first.result.current[1]("Chaos"))
    expect(first.result.current[0]).toBe("Chaos")
    expect(window.localStorage.getItem("tp.dailies.salvage.track")).toBe(
      "Chaos"
    )

    const second = renderHook(() => usePersistedSalvageTrack())
    expect(second.result.current[0]).toBe("Chaos")
  })

  it("ignores an unknown stored track", () => {
    window.localStorage.setItem("tp.dailies.salvage.track", "Necrons")
    const { result } = renderHook(() => usePersistedSalvageTrack())
    expect(result.current[0]).toBe("Imperial")
  })
})

describe("useSalvageRecommendations", () => {
  it("reports loading while the roster has not resolved", () => {
    rosterState = undefined
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("reports loading while the character catalog has not resolved", () => {
    catalogState = undefined
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("reports a retryable error when a data source fails", () => {
    goalsResult = makeResult({ isError: true })
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    const vm = result.current
    expect(vm.status).toBe("error")
    if (vm.status !== "error") return
    act(() => vm.retry())
    expect(goalsResult.refetch).toHaveBeenCalled()
  })

  it("shows the per-track shortfall when the track owns fewer than three characters", () => {
    rosterState = [character("i1"), character("i2"), character("c1")]
    catalogState = catalogMap({ i1: "Imperial", i2: "Imperial", c1: "Chaos" })
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    const vm = result.current
    expect(vm.status).toBe("insufficient-track")
    if (vm.status !== "insufficient-track") return
    expect(vm.track).toBe("Imperial")
    expect(vm.ownedCount).toBe(2)
    expect(vm.needed).toBe(1)
    expect(vm.eligible.map((c) => c.unitId)).toEqual(["i1", "i2"])
  })

  it("recovers the normal view after switching to a populated track", () => {
    rosterState = [
      character("i1"),
      character("i2"),
      character("c1"),
      character("c2"),
      character("c3"),
      character("c4"),
    ]
    catalogState = catalogMap({
      i1: "Imperial",
      i2: "Imperial",
      c1: "Chaos",
      c2: "Chaos",
      c3: "Chaos",
      c4: "Chaos",
    })
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    expect(result.current.status).toBe("insufficient-track")

    act(() => {
      if (result.current.status === "insufficient-track")
        result.current.setTrack("Chaos")
    })
    expect(result.current.status).toBe("ready")
    if (result.current.status !== "ready") return
    for (const category of result.current.recommendations.categories) {
      for (const member of category.members) {
        expect(member.unitId.startsWith("c")).toBe(true)
      }
    }
  })

  it("filters both teams to the selected track's alliance when ready", () => {
    rosterState = Array.from({ length: 8 }, (_, i) => character(`u${i}`))
    catalogState = catalogMap(
      Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [
          `u${i}`,
          i < 5 ? "Xenos" : "Imperial",
        ])
      )
    )
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    act(() => {
      if (result.current.status === "ready") result.current.setTrack("Xenos")
    })
    if (result.current.status !== "ready") throw new Error("expected ready")
    const xenos = new Set(["u0", "u1", "u2", "u3", "u4"])
    for (const category of result.current.recommendations.categories) {
      for (const member of category.members) {
        expect(xenos.has(member.unitId)).toBe(true)
      }
    }
  })

  it("only offers traits and sizes the selected track can field", () => {
    rosterState = [
      character("i1"),
      character("i2"),
      character("i3"),
      character("c1"),
      character("c2"),
      character("c3"),
      character("c4"),
    ]
    catalogState = catalogMap(
      {
        i1: "Imperial",
        i2: "Imperial",
        i3: "Imperial",
        c1: "Chaos",
        c2: "Chaos",
        c3: "Chaos",
        c4: "Chaos",
      },
      { i1: ["Flying"], c1: ["Psyker"] }
    )
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.availableTraits).toEqual(["Flying"])
    expect(result.current.availableSizes).toEqual([3])

    act(() => {
      if (result.current.status === "ready") result.current.setTrack("Chaos")
    })
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.availableTraits).toEqual(["Psyker"])
    expect(result.current.availableSizes).toEqual([3, 4])
  })

  it("persists mode and size under salvage keys, independent of the arena keys", () => {
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    act(() => {
      if (result.current.status === "ready") {
        result.current.setMode("power")
        result.current.setTeamSize(3)
      }
    })
    expect(window.localStorage.getItem("tp.dailies.salvage.mode")).toBe("power")
    expect(window.localStorage.getItem("tp.dailies.salvage.teamSize")).toBe("3")
    expect(window.localStorage.getItem("tp.dailies.arena.mode")).toBeNull()
    expect(window.localStorage.getItem("tp.dailies.arena.teamSize")).toBeNull()
  })

  it("keeps a locked random character across regenerate and drops locks on track switch", () => {
    rosterState = Array.from({ length: 8 }, (_, i) => character(`u${i}`))
    catalogState = catalogMap(
      Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [
          `u${i}`,
          i < 4 ? "Imperial" : "Chaos",
        ])
      )
    )
    const { result } = renderHook(() => useSalvageRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")

    const target = result.current.recommendations.categories.find(
      (c) => c.id === "random"
    )!.members[0].unitId
    act(() => {
      if (result.current.status === "ready")
        result.current.toggleRandomLock(target as UnitId)
    })
    act(() => {
      if (result.current.status === "ready") result.current.regenerate()
    })
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.lockedRandomUnitIds).toContain(target)

    act(() => {
      if (result.current.status === "ready") result.current.setTrack("Chaos")
    })
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.lockedRandomUnitIds).toHaveLength(0)
  })
})
