import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useDailyRaids } from "./use-daily-raids"

// Everything but the Onslaught rewards resolves immediately; the rewards are the variable under
// test (spec: daily-raids-today — "Empty rewards dataset keeps Today loading").
let onslaughtRewardsState: unknown

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getAscensionCostsMap: vi.fn(),
  getCampaignBattles: vi.fn(),
  getCampaignDefinitions: vi.fn(),
  getCharactersMap: vi.fn(),
  getMowsMap: vi.fn(),
  getNpcsMap: vi.fn(),
  getOnslaughtRewards: vi.fn(),
  getShops: vi.fn(),
  getUnlockShardCostsMap: vi.fn(),
  getUpgrades: vi.fn(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getInventoryShard: vi.fn(),
  getInventoryUpgrades: vi.fn(),
  getPlayerCharacter: vi.fn(),
  getPlayerMow: vi.fn(),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) => {
    const source = querier.toString()
    if (source.includes("getOnslaughtRewards")) return onslaughtRewardsState
    if (source.includes("playerUnitIds")) {
      return {
        playerCharacterById: new Map(),
        playerMowById: new Map(),
        inventoryShardById: new Map(),
      }
    }
    if (source.includes("Map()")) return new Map()
    return []
  },
}))
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isSuccess: true, isError: false, data: {} }),
  useQueries: () => [],
}))
vi.mock("@/entities/goal", () => ({
  goalQueries: {
    detail: (goalId: string) => ({ queryKey: ["goals", "detail", goalId] }),
  },
}))
vi.mock("@/entities/player-data-override", () => ({
  onslaughtProgressQueries: {
    current: () => ({ queryKey: ["onslaught-progress"] }),
  },
}))
vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288 },
    loading: false,
  }),
}))
vi.mock("@/features/rank-lookup/@x/daily-raids", () => ({
  mapCampaignBattleStorageToDomain: (b: unknown) => b,
  mapCharacterStorageToDomain: (c: unknown) => c,
  mapUpgradeStorageToDomain: (u: unknown) => u,
}))
vi.mock("@/shared/lib", () => ({
  useCampaignDisplay: () => ({
    name: () => "",
    tierLabel: () => "",
    shortLabel: () => "",
  }),
}))
vi.mock("./use-scoped-goal-plan", () => ({
  useScopedGoalPlan: () => ({ entries: [], loading: false, isError: false }),
}))
vi.mock("./raids-filters/use-raids-filters", () => ({
  useRaidsFilters: () => [{}],
}))
vi.mock("./use-eligible-campaign-battles", () => ({
  useEligibleCampaignBattles: () => ({
    availableBattles: [],
    liveProgressResult: { value: { battleAttempts: [] } },
    campaignEventProgressReady: true,
    campaignEventProgressError: false,
    campaignProgressResult: { value: null },
  }),
}))

describe("useDailyRaids readiness — Onslaught rewards dataset", () => {
  beforeEach(() => {
    onslaughtRewardsState = undefined
  })

  it("stays loading while the rewards dataset has not loaded", () => {
    const { result } = renderHook(() => useDailyRaids())
    expect(result.current.status).toBe("loading")
  })

  it("stays loading when the rewards dataset is present but empty", () => {
    onslaughtRewardsState = []
    const { result } = renderHook(() => useDailyRaids())
    expect(result.current.status).toBe("loading")
  })

  it("proceeds once the rewards dataset has rows", () => {
    onslaughtRewardsState = [
      { id: "Stone-1", sector: "Stone", tier: 1, regular: [], mythic: {} },
    ]
    const { result } = renderHook(() => useDailyRaids())
    // No goals in the (mocked, empty) plan — past the readiness gate, this is the next state.
    expect(result.current.status).toBe("no-goals")
  })
})
