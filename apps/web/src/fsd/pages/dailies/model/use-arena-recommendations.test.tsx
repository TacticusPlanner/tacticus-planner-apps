import type { UnitId } from "@workspace/game-domain"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  useArenaRecommendations,
  usePersistedArenaMode,
  usePersistedArenaPreferences,
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
let catalogState: unknown

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: vi.fn(),
}))
vi.mock("dexie-react-hooks", () => ({
  // Two live queries now — the roster and the character catalog. Branch on the querier's source so
  // each gets its own canned value.
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

/** A minimal catalog map covering whatever ids `rosterState` holds. Pass `traits` / `damageTypes`
 * per id to exercise the preference filters. */
const catalogMap = (
  entries: Record<
    string,
    { traits?: string[]; meleeDamage?: string; rangedDamage?: string | null }
  > = {}
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
        traits: entries[id]?.traits ?? [],
        meleeDamage: entries[id]?.meleeDamage ?? "Physical",
        rangedDamage: entries[id]?.rangedDamage ?? null,
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

describe("usePersistedArenaPreferences", () => {
  it("defaults to no preference with nothing stored", () => {
    const { result } = renderHook(() => usePersistedArenaPreferences())
    expect(result.current[0]).toEqual({})
  })

  it("round-trips and merge-patches a preference through localStorage", () => {
    const first = renderHook(() => usePersistedArenaPreferences())
    act(() => first.result.current[1]({ trait: "Flying" }))
    act(() => first.result.current[1]({ damageType: "Bolter" }))
    expect(first.result.current[0]).toEqual({
      trait: "Flying",
      damageType: "Bolter",
    })

    const second = renderHook(() => usePersistedArenaPreferences())
    expect(second.result.current[0]).toEqual({
      trait: "Flying",
      damageType: "Bolter",
    })

    act(() => second.result.current[1]({ trait: undefined }))
    expect(second.result.current[0]).toEqual({ damageType: "Bolter" })
  })

  it("degrades a malformed stored value to no preference", () => {
    window.localStorage.setItem(
      "tp.dailies.arena.preferences",
      '{"trait":42,"damageType":["nope"]}'
    )
    const { result } = renderHook(() => usePersistedArenaPreferences())
    expect(result.current[0]).toEqual({})
  })
})

describe("useArenaRecommendations", () => {
  it("reports loading while the roster has not resolved", () => {
    rosterState = undefined
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("reports loading while the character catalog has not resolved", () => {
    catalogState = undefined
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("exposes the traits and damage types the owned roster covers", () => {
    rosterState = [character("a"), character("b"), character("c")]
    catalogState = catalogMap({
      a: { traits: ["Flying", "Healer"], meleeDamage: "Physical" },
      b: { traits: ["Flying"], meleeDamage: "Bolter" },
      c: { traits: [], meleeDamage: "Psychic" },
    })
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")
    expect(result.current.availableTraits).toEqual(["Flying", "Healer"])
    expect(result.current.availableDamageTypes).toEqual([
      "Bolter",
      "Physical",
      "Psychic",
    ])
  })

  it("restricts both teams to a satisfiable preferred trait", () => {
    rosterState = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    catalogState = catalogMap(
      Object.fromEntries(
        Array.from({ length: 8 }, (_, index) => [
          `u${index}`,
          { traits: index < 5 ? ["Flying"] : [] },
        ])
      )
    )
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")

    act(() => {
      if (result.current.status === "ready")
        result.current.setPreferences({ trait: "Flying" })
    })
    if (result.current.status !== "ready") throw new Error("expected ready")

    const flyers = new Set(["u0", "u1", "u2", "u3", "u4"])
    for (const category of result.current.recommendations.categories) {
      for (const member of category.members) {
        expect(flyers.has(member.unitId)).toBe(true)
      }
    }
  })

  it("falls back to full teams when no owned character matches the preference", () => {
    rosterState = Array.from({ length: 8 }, (_, index) =>
      character(`u${index}`)
    )
    catalogState = catalogMap()
    const { result } = renderHook(() => useArenaRecommendations("p1"))
    if (result.current.status !== "ready") throw new Error("expected ready")

    act(() => {
      if (result.current.status === "ready")
        result.current.setPreferences({ trait: "Nonexistent" })
    })
    if (result.current.status !== "ready") throw new Error("expected ready")

    for (const category of result.current.recommendations.categories) {
      expect(category.members).toHaveLength(5)
    }
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
