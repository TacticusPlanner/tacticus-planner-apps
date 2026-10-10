import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useDailyRaids } from "./use-daily-raids"

// Scope: the load gates for the campaign-event overrides this hook now reads. Eligibility itself is
// covered by campaign-event-eligibility.test.ts; the whole calculation by daily-raids-calc.test.ts.

const overrides = vi.hoisted(() => ({ fail: false }))

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => true,
}))

// Dexie-backed catalog and player data stay "not loaded yet", so a hook that is not in error is
// "loading" — enough to tell the two gates apart without seeding IndexedDB.
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => undefined,
}))

vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({ settings: {}, loading: false }),
}))

vi.mock("./use-scoped-goal-plan", () => ({
  useScopedGoalPlan: () => ({ entries: [], loading: false, isError: false }),
}))

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

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe("useDailyRaids campaign-event override gates", () => {
  beforeEach(() => {
    overrides.fail = false
  })

  it("reports an error when the campaign-event overrides fail to load", async () => {
    overrides.fail = true
    const { result } = renderHook(() => useDailyRaids("project-1"), {
      wrapper,
    })
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("keeps loading, not erroring, while the overrides load successfully", async () => {
    const { result } = renderHook(() => useDailyRaids("project-1"), {
      wrapper,
    })
    await waitFor(() => expect(result.current.status).toBe("loading"))
    // Give the override query time to settle; it must not flip the hook into error.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(result.current.status).toBe("loading")
  })
})
