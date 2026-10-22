import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, waitFor } from "@/test/render"

import { useDailyRaids } from "./use-daily-raids"

// Scope: the load gates for the campaign-event overrides this hook now reads. Eligibility itself is
// covered by campaign-event-eligibility.test.ts; the whole calculation by daily-raids-calc.test.ts.
// The real catalog and player-data stores stay empty (inventory upgrades never synced), so a hook
// that is not in error is "loading" — enough to tell the two gates apart.

const overrides = vi.hoisted(() => ({ fail: false }))

vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({ settings: {}, loading: false }),
}))

const scoped = vi.hoisted(() => ({
  entries: [] as { goal: Record<string, unknown> }[],
}))
vi.mock("./use-scoped-goal-plan", () => ({
  useScopedGoalPlan: () => ({
    entries: scoped.entries,
    loading: false,
    isError: false,
  }),
}))
const getGoal = vi.hoisted(() => vi.fn())
vi.mock("@/entities/goal/api/goal.api", () => ({ getGoal, listGoals: vi.fn() }))

vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["onslaught"],
      queryFn: async () => ({ revision: 1 }),
    }),
  },
  campaignEventProgressQueries: {
    current: () => ({
      queryKey: ["campaign-events"],
      queryFn: async () => {
        if (overrides.fail) throw new Error("boom")
        return { progress: [], revision: 1 }
      },
    }),
  },
}))

// The harness `renderHook` is Testing Library's own (no QueryClient or auth), so the hook runs in a
// probe mounted through the harness `render`, signed in.
function renderDailyRaids(projectId: string) {
  const result = {} as { current: ReturnType<typeof useDailyRaids> }
  function Probe() {
    result.current = useDailyRaids(projectId)
    return null
  }
  render(<Probe />, { auth: { authenticated: true } })
  return { result }
}

describe("useDailyRaids campaign-event override gates", () => {
  beforeEach(() => {
    overrides.fail = false
    scoped.entries = []
  })

  it("reads every planned goal from the list entries, never a goal detail", async () => {
    scoped.entries = [
      {
        goal: {
          goalId: "g1",
          status: "Active",
          entityType: "Character",
          entityId: "ragnar",
          globalPriority: 1,
          projectIds: ["project-1"],
        },
      },
    ]
    const { result } = renderDailyRaids("project-1")
    await waitFor(() => expect(result.current.status).toBe("loading"))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(getGoal).not.toHaveBeenCalled()
  })

  it("reports an error when the campaign-event overrides fail to load", async () => {
    overrides.fail = true
    const { result } = renderDailyRaids("project-1")
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("keeps loading, not erroring, while the overrides load successfully", async () => {
    const { result } = renderDailyRaids("project-1")
    await waitFor(() => expect(result.current.status).toBe("loading"))
    // Give the override query time to settle; it must not flip the hook into error.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(result.current.status).toBe("loading")
  })
})
