import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  usePersistedOnslaughtTrack,
  useOnslaughtRecommendations,
} from "./use-onslaught-recommendations"
import type { OnslaughtShardRecipientResult } from "./onslaught-shard-recipient"

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
let mowsState: unknown
let catalogState: unknown
let mowCatalogState: unknown
let ascensionCostsState: unknown
let shardRecipientResult: OnslaughtShardRecipientResult

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: vi.fn(),
  getMowsMap: vi.fn(),
  getAscensionCostsMap: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: vi.fn(),
  getPlayerMows: vi.fn(),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) => {
    const source = querier.toString()
    if (source.includes("getMowsMap")) return mowCatalogState
    if (source.includes("getCharactersMap")) return catalogState
    if (source.includes("getPlayerMows")) return mowsState
    if (source.includes("getAscensionCostsMap")) return ascensionCostsState
    return rosterState
  },
}))
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: readonly unknown[] }) =>
    options.queryKey[0] === "goals" ? goalsResult : projectGoalsResult,
  useQueries: () => [],
}))
vi.mock("@/entities/goal", () => ({
  goalQueries: {
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
    }),
    detail: (goalId: string) => ({ queryKey: ["goals", "detail", goalId] }),
  },
}))
vi.mock("@/entities/project", () => ({
  projectQueries: {
    goals: (projectId: string) => ({
      queryKey: ["projects", "detail", projectId, "goals"],
    }),
  },
}))
vi.mock("./onslaught-shard-recipient", () => ({
  recommendOnslaughtShardRecipient: () => shardRecipientResult,
}))

const character = (unitId: string) => ({
  unitId,
  rank: "Stone1",
  progressionIndex: "Common:None",
  xpLevel: 3,
  shards: 0,
  mythicShards: 0,
  appliedUpgradeSlots: [],
  abilities: [{ level: 1 }, { level: 1 }],
})

const catalogMap = (alliances: Record<string, string> = {}) => {
  const ids = Array.isArray(rosterState)
    ? (rosterState as { unitId: string }[]).map((c) => c.unitId)
    : []
  return new Map(
    ids.map((id) => [
      id,
      {
        id,
        alliance: alliances[id] ?? "Imperial",
        traits: [],
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
  mowsState = []
  catalogState = catalogMap()
  mowCatalogState = new Map()
  ascensionCostsState = new Map()
  shardRecipientResult = { status: "none" }
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("usePersistedOnslaughtTrack", () => {
  it("defaults to Imperial and round-trips through its own key", () => {
    const first = renderHook(() => usePersistedOnslaughtTrack())
    expect(first.result.current[0]).toBe("Imperial")
    act(() => first.result.current[1]("Xenos"))
    expect(window.localStorage.getItem("tp.dailies.onslaught.track")).toBe(
      "Xenos"
    )
    const second = renderHook(() => usePersistedOnslaughtTrack())
    expect(second.result.current[0]).toBe("Xenos")
  })

  it("ignores an unknown stored track", () => {
    window.localStorage.setItem("tp.dailies.onslaught.track", "Tyranids")
    const { result } = renderHook(() => usePersistedOnslaughtTrack())
    expect(result.current[0]).toBe("Imperial")
  })
})

describe("useOnslaughtRecommendations", () => {
  it("reports loading while the MoW catalog has not resolved", () => {
    mowCatalogState = undefined
    const { result } = renderHook(() => useOnslaughtRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("reports loading while the ascension costs have not resolved", () => {
    ascensionCostsState = undefined
    const { result } = renderHook(() => useOnslaughtRecommendations("p1"))
    expect(result.current.status).toBe("loading")
  })

  it("reports a retryable error when a data source fails", () => {
    goalsResult = makeResult({ isError: true })
    const { result } = renderHook(() => useOnslaughtRecommendations("p1"))
    const vm = result.current
    expect(vm.status).toBe("error")
    if (vm.status !== "error") return
    act(() => vm.retry())
    expect(goalsResult.refetch).toHaveBeenCalled()
  })

  it("carries the shard recipient in the ready view model", () => {
    shardRecipientResult = {
      status: "ready",
      recipient: {
        unitId: "a",
        unitName: "A",
        unitKind: "character",
        goalId: "g1",
        currentRarity: "Common",
        targetRarity: "Rare",
        currentShards: 0,
        requiredShards: 40,
        remainingShards: 40,
        reason: "onlyCandidate",
      },
      alternates: [],
    }
    const { result } = renderHook(() => useOnslaughtRecommendations("p1"))
    const vm = result.current
    expect(vm.status).toBe("ready")
    if (vm.status !== "ready") return
    expect(vm.shardRecipient).toBe(shardRecipientResult)
  })

  it("carries the shard recipient in the insufficient-track view model", () => {
    rosterState = [character("i1"), character("c1"), character("c2")]
    catalogState = catalogMap({ i1: "Imperial", c1: "Chaos", c2: "Chaos" })
    shardRecipientResult = { status: "none" }
    const { result } = renderHook(() => useOnslaughtRecommendations("p1"))
    const vm = result.current
    expect(vm.status).toBe("insufficient-track")
    if (vm.status !== "insufficient-track") return
    expect(vm.ownedCount).toBe(1)
    expect(vm.shardRecipient).toEqual({ status: "none" })
  })

  it("persists mode and size under onslaught keys, independent of arena and salvage", () => {
    const { result } = renderHook(() => useOnslaughtRecommendations("p1"))
    act(() => {
      if (result.current.status === "ready") {
        result.current.setMode("power")
        result.current.setTeamSize(3)
      }
    })
    expect(window.localStorage.getItem("tp.dailies.onslaught.mode")).toBe(
      "power"
    )
    expect(window.localStorage.getItem("tp.dailies.onslaught.teamSize")).toBe(
      "3"
    )
    expect(window.localStorage.getItem("tp.dailies.arena.mode")).toBeNull()
    expect(window.localStorage.getItem("tp.dailies.salvage.mode")).toBeNull()
  })
})
