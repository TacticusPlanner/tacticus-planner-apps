import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@/test/render"

// What `useGoalCatalog` reports, switched per test: upgrades and the eligible battle list load on
// their own and start out as empty maps.
const catalog = vi.hoisted(() => ({
  upgradesReady: false,
  battlesReady: false,
  battlesById: new Map<string, unknown>(),
}))
const compute = vi.hoisted(() => vi.fn())
// Every other read returns the same objects on each render, as the real memoised hooks do.
const stable = vi.hoisted(() => ({
  plan: {
    entries: [
      {
        goal: {
          goalId: "g1",
          entityId: "unit1",
          globalPriority: 1,
          revision: 1,
        },
      },
    ],
    loading: false,
    isError: false,
    retry: () => {},
  },
  settings: { settings: { xpBookRarity: "Common", dailyEnergy: 288 } },
  levelRules: {},
  display: { name: () => "", fullLabel: () => "" },
  dataset: { status: "ready", data: [{}] },
  globalValues: { status: "ready", data: 1 },
  chunk: { status: "ready", data: undefined },
  maps: {
    upgradesById: new Map(),
    allBattlesById: new Map(),
    campaignProgressByKey: new Map(),
    campaignDefinitions: [],
    charactersById: new Map(),
    mowsById: new Map(),
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    releaseTypeByGroupId: new Map(),
    getCharacter: () => undefined,
  },
  gate: {},
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/entities/goal", () => ({ useGlobalGoalPlan: () => stable.plan }))
vi.mock("@/entities/player-data-override", () => ({
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["onslaught-progress"],
      queryFn: () => Promise.resolve({ progress: [] }),
    }),
  },
}))
vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => stable.settings,
}))
vi.mock("@/features/goal-farming/@x/goal-planning", () => ({
  toOnslaughtRunsPerDay: () => 1,
  useLevelRules: () => stable.levelRules,
}))
vi.mock("@/shared/lib", () => ({
  useCampaignDisplay: () => stable.display,
}))
vi.mock("@/shared/local-data", () => ({
  useCatalogDataset: (name: string) =>
    name === "global-values" ? stable.globalValues : stable.dataset,
  usePlayerChunk: () => stable.chunk,
}))
vi.mock("@workspace/player-data/queries", () => ({
  getInventoryShard: () => Promise.resolve(undefined),
  getPlayerCharacter: () => Promise.resolve(undefined),
  getPlayerMow: () => Promise.resolve(undefined),
}))
vi.mock("../shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({
    ...stable.maps,
    battlesById: catalog.battlesById,
    upgradesReady: catalog.upgradesReady,
    battlesReady: catalog.battlesReady,
  }),
}))
vi.mock("../unlock-paths/use-campaign-gate-context", () => ({
  useCampaignGateContext: () => stable.gate,
}))
vi.mock("./plan-insights-calc", () => ({ computePlanInsights: compute }))

import { EMPTY_PLAN_INSIGHTS_RESULT } from "./use-plan-insights.domain"
import { usePlanInsights } from "./use-plan-insights"

describe("usePlanInsights", () => {
  beforeEach(() => {
    catalog.upgradesReady = false
    catalog.battlesReady = false
    catalog.battlesById = new Map()
    compute.mockReset()
    compute.mockImplementation(() => ({
      ...EMPTY_PLAN_INSIGHTS_RESULT,
      energyTotal: catalog.battlesById.size,
    }))
  })

  it("waits for upgrades and the eligible battles before computing", async () => {
    const { result, rerender } = renderHook(() => usePlanInsights())
    // Let the Onslaught progress read settle: still nothing computed, because upgrades and battles
    // read as "nothing drops anywhere" until they load.
    await waitFor(() => expect(result.current.loading).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(compute).not.toHaveBeenCalled()

    catalog.upgradesReady = true
    rerender()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(compute).not.toHaveBeenCalled()

    catalog.battlesReady = true
    rerender()
    await waitFor(() => expect(compute).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it("recomputes when the eligible battles change", async () => {
    catalog.upgradesReady = true
    catalog.battlesReady = true
    const { result, rerender } = renderHook(() => usePlanInsights())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.result.energyTotal).toBe(0)

    // An event-progress or battle-override load opens a node without touching campaign progress.
    catalog.battlesById = new Map([["node1", {}]])
    rerender()
    await waitFor(() => expect(result.current.result.energyTotal).toBe(1))
  })
})
