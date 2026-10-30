import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, renderHook, waitFor } from "@/test/render"
import { globalValuesFixture } from "@workspace/game-catalog/testing"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { useDailyRaids } from "./use-daily-raids"

// Everything but the Onslaught rewards resolves from the (empty) real stores; the rewards are the
// variable under test (spec: daily-raids-today — "Empty rewards dataset keeps Today loading").

vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
  battleProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "battle-progress"],
      queryFn: () => Promise.resolve({ battles: [], revision: 1 }),
    }),
  },
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["onslaught-progress"],
      queryFn: async () => ({ revision: 1 }),
    }),
  },
}))
vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288 },
    loading: false,
  }),
}))
const scoped = vi.hoisted(() => ({ entries: [] as unknown[] }))
vi.mock("./use-scoped-goal-plan", () => ({
  useScopedGoalPlan: () => ({
    entries: scoped.entries,
    loading: false,
    isError: false,
  }),
}))
const filters = vi.hoisted(() => ({}))
vi.mock("./raids-filters/use-raids-filters", () => ({
  useRaidsFilters: () => [filters],
}))
vi.mock("./use-eligible-campaign-battles", () => ({
  useEligibleCampaignBattles: () => eligible,
}))
const eligible = vi.hoisted(() => ({
  availableBattles: [],
  liveProgress: { battleAttempts: [] },
  ready: true,
  isError: false,
}))

// The harness `renderHook` is Testing Library's own (no QueryClient or auth), so the hook runs in a
// probe mounted through the harness `render`, signed in.
function renderDailyRaids() {
  const result = {} as { current: ReturnType<typeof useDailyRaids> }
  function Probe() {
    result.current = useDailyRaids()
    return null
  }
  render(<Probe />, { auth: { authenticated: true } })
  return { result }
}

/** Gives every other local read time to settle, so only the rewards gate can hold the hook. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe("useDailyRaids readiness — Onslaught rewards dataset", () => {
  beforeEach(async () => {
    scoped.entries = []
    await seedPlayerData({ "inventory-upgrades": [] })
  })

  it("stays loading while the rewards dataset has not loaded", () => {
    const { result } = renderDailyRaids()
    expect(result.current.status).toBe("loading")
  })

  it("stays loading when the rewards dataset is present but empty", async () => {
    await seedGameCatalog({
      "global-values": [globalValuesFixture],
      "onslaught-rewards": [],
    })
    const { result } = renderDailyRaids()
    await settle()
    expect(result.current.status).toBe("loading")
  })

  it("proceeds once the rewards dataset has rows", async () => {
    await seedGameCatalog({
      "global-values": [globalValuesFixture],
      "onslaught-rewards": [
        { id: "Stone-1", sector: "Stone", tier: 1, regular: [], mythic: {} },
      ],
    })
    const { result } = renderDailyRaids()
    // No goals in the (mocked, empty) plan — past the readiness gate, this is the next state.
    await waitFor(() => expect(result.current.status).toBe("no-goals"))
  })
})

describe("useDailyRaids memo boundary", () => {
  const request = { battlesToGo: 3, eventOnly: false }
  const activeGoal = {
    goal: {
      goalId: "g1",
      status: "Active",
      goalType: "Rank",
      entityType: "Character",
      entityId: "ultraCato",
      globalPriority: 1,
      projectIds: [],
      config: {},
    },
  }

  beforeEach(async () => {
    scoped.entries = []
    await seedPlayerData({ "inventory-upgrades": [] })
    await seedGameCatalog({
      "global-values": [globalValuesFixture],
      "onslaught-rewards": [
        { id: "Stone-1", sector: "Stone", tier: 1, regular: [], mythic: {} },
      ],
    })
  })

  function renderMemoHook() {
    return renderHook(
      ({ missionRaids }) => useDailyRaids(undefined, { missionRaids }),
      { auth: { authenticated: true }, initialProps: { missionRaids: request } }
    )
  }

  it("returns the same result for the same inputs and a new one when an input changes", async () => {
    const { result, rerender } = renderMemoHook()
    await waitFor(() => expect(result.current.status).toBe("no-goals"))
    const first = result.current
    rerender({ missionRaids: request })
    expect(result.current).toBe(first)
    rerender({ missionRaids: { ...request, battlesToGo: 4 } })
    expect(result.current).not.toBe(first)
    expect(result.current.status).toBe("no-goals")
  })

  it("goes from no goals to an active goal and back without changing the Hook order", async () => {
    const { result, rerender } = renderMemoHook()
    await waitFor(() => expect(result.current.status).toBe("no-goals"))
    scoped.entries = [activeGoal]
    rerender({ missionRaids: request })
    expect(result.current.status).not.toBe("no-goals")
    expect(result.current.status).not.toBe("loading")
    scoped.entries = []
    rerender({ missionRaids: request })
    expect(result.current.status).toBe("no-goals")
  })
})
