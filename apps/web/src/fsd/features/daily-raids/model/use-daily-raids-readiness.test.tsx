import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { useDailyRaids } from "./use-daily-raids"

// Everything but the Onslaught rewards resolves from the (empty) real stores; the rewards are the
// variable under test (spec: daily-raids-today — "Empty rewards dataset keeps Today loading").

vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
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
vi.mock("./use-scoped-goal-plan", () => ({
  useScopedGoalPlan: () => ({ entries: [], loading: false, isError: false }),
}))
vi.mock("./raids-filters/use-raids-filters", () => ({
  useRaidsFilters: () => [{}],
}))
vi.mock("./use-eligible-campaign-battles", () => ({
  useEligibleCampaignBattles: () => ({
    availableBattles: [],
    liveProgress: { battleAttempts: [] },
    ready: true,
    isError: false,
  }),
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
    await seedPlayerData({ "inventory-upgrades": [] })
  })

  it("stays loading while the rewards dataset has not loaded", () => {
    const { result } = renderDailyRaids()
    expect(result.current.status).toBe("loading")
  })

  it("stays loading when the rewards dataset is present but empty", async () => {
    await seedGameCatalog({ "onslaught-rewards": [] })
    const { result } = renderDailyRaids()
    await settle()
    expect(result.current.status).toBe("loading")
  })

  it("proceeds once the rewards dataset has rows", async () => {
    await seedGameCatalog({
      "onslaught-rewards": [
        { id: "Stone-1", sector: "Stone", tier: 1, regular: [], mythic: {} },
      ],
    })
    const { result } = renderDailyRaids()
    // No goals in the (mocked, empty) plan — past the readiness gate, this is the next state.
    await waitFor(() => expect(result.current.status).toBe("no-goals"))
  })
})
