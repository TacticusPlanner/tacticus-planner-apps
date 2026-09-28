import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useScopedGoalPlan } from "./use-scoped-goal-plan"

const projectGoals = vi.fn()

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/entities/goal", () => ({
  useGlobalGoalPlan: () => ({
    entries: ["g1", "g2", "g3"].map((goalId) => ({ goal: { goalId } })),
    loading: false,
    isError: false,
  }),
}))
vi.mock("@/entities/project", () => ({
  projectQueries: {
    goals: (projectId: string) => ({
      queryKey: ["project-goals", projectId],
      queryFn: () => projectGoals(projectId),
    }),
  },
}))

function setup(projectId?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useScopedGoalPlan(projectId), { wrapper })
}

const ids = (entries: { goal: { goalId: string } }[]) =>
  entries.map((entry) => entry.goal.goalId)

describe("useScopedGoalPlan", () => {
  it("returns the whole global plan when no project is selected", () => {
    const { result } = setup()

    expect(ids(result.current.entries)).toEqual(["g1", "g2", "g3"])
    expect(result.current.loading).toBe(false)
    expect(projectGoals).not.toHaveBeenCalled()
  })

  it("keeps only the project's goals, in global order", async () => {
    projectGoals.mockResolvedValue({
      goals: [{ goal: { goalId: "g3" } }, { goal: { goalId: "g1" } }],
    })
    const { result } = setup("p1")

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(ids(result.current.entries)).toEqual(["g1", "g3"])
  })

  it("reports a failed membership load as an error, not an empty plan", async () => {
    projectGoals.mockRejectedValue(new Error("boom"))
    const { result } = setup("p2")

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
