import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
const api = vi.hoisted(() => ({
  listGoals: vi.fn(),
  listProjects: vi.fn(),
}))
vi.mock("@/entities/goal/api/goal.api", () => ({
  listGoals: api.listGoals,
  getGoal: vi.fn(),
}))
vi.mock("@/entities/project/api/project.api", () => ({
  listProjects: api.listProjects,
}))

import { useProjectsWithGoals } from "./use-projects-with-goals"

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  )
}

describe("useProjectsWithGoals", () => {
  it("derives each project's members from its goalIds, waiting for both lists", async () => {
    let finishGoals!: (value: unknown) => void
    api.listGoals.mockReturnValue(new Promise((done) => (finishGoals = done)))
    api.listProjects.mockResolvedValue({
      projects: [
        { projectId: "p1", goalIds: ["b", "a"] },
        { projectId: "p2", goalIds: ["archived"] },
      ],
    })
    const { result } = renderHook(() => useProjectsWithGoals(), { wrapper })

    await waitFor(() => expect(api.listProjects).toHaveBeenCalled())
    expect(result.current.loading).toBe(true)

    finishGoals({
      goals: [{ goalId: "a" }, { goalId: "b" }],
      orderRevision: 1,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(
      result.current.projects.map((project) => [
        project.projectId,
        project.goals.map((goal) => goal.goalId),
      ])
    ).toEqual([
      ["p1", ["b", "a"]],
      ["p2", []],
    ])
  })

  it("reports an error when either list fails", async () => {
    api.listGoals.mockRejectedValue(new Error("boom"))
    api.listProjects.mockResolvedValue({ projects: [] })
    const { result } = renderHook(() => useProjectsWithGoals(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
