import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { projectQueries, type ProjectGoalSummary } from "@/entities/project"
import { useProjectActions } from "./use-project-actions"

const { activateProjectMock, updateProjectGoalOrderMock } = vi.hoisted(() => ({
  activateProjectMock: vi.fn(),
  updateProjectGoalOrderMock: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    activateProject: activateProjectMock,
    updateProjectGoalOrder: updateProjectGoalOrderMock,
  }
})

function goal(id: string, priority: number): ProjectGoalSummary {
  return {
    goal: {
      goalId: id,
      entityType: "character",
      entityId: id,
      goalType: "Rank",
      status: "Active",
      notes: null,
      dependsOn: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    priority,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { retry: false },
    },
  })
  const wrapper = function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return { queryClient, wrapper }
}

describe("useProjectActions", () => {
  beforeEach(() => {
    activateProjectMock.mockReset()
    updateProjectGoalOrderMock.mockReset()
  })

  it("stays pending until every overlapping action has settled", async () => {
    let resolveFirst!: () => void
    let resolveSecond!: () => void
    activateProjectMock
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirst = resolve
        })
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveSecond = resolve
        })
      )
    const { result } = renderHook(() => useProjectActions(), {
      wrapper: createWrapper().wrapper,
    })
    let first!: Promise<void>
    let second!: Promise<void>

    act(() => {
      first = result.current.activate("p1")
      second = result.current.activate("p2")
    })
    await waitFor(() => expect(result.current.pending).toBe(true))

    await act(async () => {
      resolveFirst()
      await first
    })
    expect(result.current.pending).toBe(true)

    await act(async () => {
      resolveSecond()
      await second
    })
    expect(result.current.pending).toBe(false)
  })

  it("reorders the cached goal list immediately, before the request resolves", async () => {
    const { queryClient, wrapper } = createWrapper()
    const queryKey = projectQueries.goals("p1").queryKey
    queryClient.setQueryData(queryKey, {
      goals: [goal("a", 1), goal("b", 2), goal("c", 3)],
    })
    let resolveRequest!: () => void
    updateProjectGoalOrderMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRequest = resolve
      })
    )
    const { result } = renderHook(() => useProjectActions(), { wrapper })

    let reordered!: Promise<boolean>
    act(() => {
      reordered = result.current.reorderGoals("p1", ["c", "a", "b"])
    })

    await waitFor(() =>
      expect(
        queryClient
          .getQueryData<{ goals: ProjectGoalSummary[] }>(queryKey)
          ?.goals.map((entry) => entry.goal.goalId)
      ).toEqual(["c", "a", "b"])
    )

    await act(async () => {
      resolveRequest()
      await reordered
    })
  })

  it("rolls back the cached goal list when the request fails", async () => {
    const { queryClient, wrapper } = createWrapper()
    const queryKey = projectQueries.goals("p1").queryKey
    const original = [goal("a", 1), goal("b", 2), goal("c", 3)]
    queryClient.setQueryData(queryKey, { goals: original })
    updateProjectGoalOrderMock.mockRejectedValue(new Error("network error"))
    const { result } = renderHook(() => useProjectActions(), { wrapper })

    await act(async () => {
      await result.current.reorderGoals("p1", ["c", "a", "b"])
    })

    expect(
      queryClient.getQueryData<{ goals: ProjectGoalSummary[] }>(queryKey)?.goals
    ).toEqual(original)
  })
})
