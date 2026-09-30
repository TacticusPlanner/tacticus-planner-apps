import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, act } from "@/test/render"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}))
vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()
const updateGoalProjects = vi.fn()
vi.mock("@/entities/goal", () => ({
  updateGoalStatus: (...a: unknown[]) => updateGoalStatus(...a),
  deleteGoal: (...a: unknown[]) => deleteGoal(...a),
  updateGoalProjects: (...a: unknown[]) => updateGoalProjects(...a),
  goalQueries: { all: () => ["goals"] },
}))
vi.mock("@/entities/project", () => ({
  projectQueries: { all: () => ["projects"] },
}))
vi.mock("@/shared/api", () => ({ ApiError: class extends Error {} }))

import { useGoalActions } from "./use-goal-actions"

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const project = { projectId: "p1", name: "Proj" } as never

describe("useGoalActions bulk", () => {
  beforeEach(() => {
    updateGoalStatus.mockReset().mockResolvedValue({})
    deleteGoal.mockReset().mockResolvedValue({})
    updateGoalProjects.mockReset().mockResolvedValue({})
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("setStatusMany: all succeed -> no toast", async () => {
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() =>
      result.current.setStatusMany(
        [
          { goalId: "a", previousStatus: "Active" },
          { goalId: "b", previousStatus: "Active" },
        ],
        "Paused"
      )
    )
    expect(updateGoalStatus).toHaveBeenCalledTimes(2)
    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.pendingIds.size).toBe(0)
  })

  it("setStatusMany: one fails -> one aggregate toast", async () => {
    updateGoalStatus.mockImplementation((id: string) =>
      id === "b" ? Promise.reject(new Error("x")) : Promise.resolve({})
    )
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() =>
      result.current.setStatusMany(
        [
          { goalId: "a", previousStatus: "Active" },
          { goalId: "b", previousStatus: "Active" },
        ],
        "Paused"
      )
    )
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      'goals.toasts.statusChangedPartial:{"succeeded":1,"total":2}'
    )
  })

  it("removeMany: failure -> one toast", async () => {
    deleteGoal.mockImplementation((id: string) =>
      id === "b" ? Promise.reject(new Error("x")) : Promise.resolve({})
    )
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() => result.current.removeMany(["a", "b"]))
    expect(deleteGoal).toHaveBeenCalledTimes(2)
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("addToProject: skips members, keeps memberships, toasts added count", async () => {
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() =>
      result.current.addToProject(
        [
          { goalId: "a", projects: [{ projectId: "p1" }] },
          { goalId: "b", projects: [{ projectId: "p2" }] },
          { goalId: "c" },
        ],
        project
      )
    )
    expect(updateGoalProjects).toHaveBeenCalledTimes(2)
    expect(updateGoalProjects).toHaveBeenCalledWith("b", ["p2", "p1"])
    expect(updateGoalProjects).toHaveBeenCalledWith("c", ["p1"])
    expect(toast.success).toHaveBeenCalledExactlyOnceWith(
      'goals.toasts.goalsAddedToProject:{"project":"Proj","count":2}'
    )
  })
})
