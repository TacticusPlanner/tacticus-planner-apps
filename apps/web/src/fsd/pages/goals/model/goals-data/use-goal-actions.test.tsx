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
vi.mock("@/entities/goal", () => ({
  updateGoalStatus: (...a: unknown[]) => updateGoalStatus(...a),
  deleteGoal: (...a: unknown[]) => deleteGoal(...a),
  goalQueries: { all: () => ["goals"] },
}))
// Each project's membership, changed in place the way the single PUT would.
const members = new Map<string, string[]>()
const changeProjectMembership = vi.fn(
  async (
    projectId: string,
    change: (current: readonly string[]) => string[]
  ) => {
    const before = members.get(projectId) ?? []
    const after = [...new Set(change(before))]
    members.set(projectId, after)
    return { before, after }
  }
)
vi.mock("@/entities/project", () => ({
  projectQueries: { all: () => ["projects"] },
  changeProjectMembership: (...a: Parameters<typeof changeProjectMembership>) =>
    changeProjectMembership(...a),
}))
vi.mock("@/shared/api", () => ({ ApiError: class extends Error {} }))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) => `Unit ${id}`,
}))
vi.mock("../projects/project-conflict-copy", () => ({
  membershipErrorText: () => "membership-error",
}))

import { useGoalActions } from "./use-goal-actions"

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const project = { projectId: "p1", name: "Proj" } as never
const destination = { projectId: "p3", name: "Dest" } as never
const row = (goalId: string, projectIds: string[]) =>
  ({
    goalId,
    entityType: "Character",
    entityId: goalId,
    goalType: "Rank",
    projects: projectIds.map((projectId) => ({ projectId })),
  }) as never

describe("useGoalActions bulk", () => {
  beforeEach(() => {
    updateGoalStatus.mockReset().mockResolvedValue({})
    deleteGoal.mockReset().mockResolvedValue({})
    changeProjectMembership.mockClear()
    members.clear()
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

  it("addToProject: one membership request for the whole selection, toasts the added count", async () => {
    members.set("p1", ["a"])
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() =>
      result.current.addToProject(
        [{ goalId: "a" }, { goalId: "b" }, { goalId: "c" }],
        project
      )
    )
    expect(changeProjectMembership).toHaveBeenCalledTimes(1)
    expect(members.get("p1")).toEqual(["a", "b", "c"])
    expect(toast.success).toHaveBeenCalledExactlyOnceWith(
      'goals.toasts.goalsAddedToProject:{"project":"Proj","count":2}'
    )
    expect(result.current.pendingIds.size).toBe(0)
  })

  it("addToProject: a rejected request adds nothing and reports once", async () => {
    changeProjectMembership.mockRejectedValueOnce(new Error("slot"))
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() =>
      result.current.addToProject([{ goalId: "a" }, { goalId: "b" }], project)
    )
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("membership-error")
  })

  it("removeFromProject: removes the rows in one request and names the goal for a single row", async () => {
    members.set("p1", ["a", "b"])
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    let ok = false
    await act(async () => {
      ok = await result.current.removeFromProject(
        [row("a", ["p1", "p2"])],
        project
      )
    })
    expect(ok).toBe(true)
    expect(members.get("p1")).toEqual(["b"])
    expect(toast.success).toHaveBeenCalledExactlyOnceWith(
      'goals.toasts.goalRemovedFromProject:{"goal":"Unit a · goals.create.goalTypes.Rank","project":"Proj"}'
    )
  })

  it("removeFromProject: moves last-membership rows to the destination before removing", async () => {
    members.set("p1", ["a", "b", "c"])
    members.set("p3", ["x"])
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    await act(() =>
      result.current.removeFromProject(
        [row("a", ["p1"]), row("b", ["p1", "p2"])],
        project,
        destination
      )
    )
    expect(changeProjectMembership.mock.calls.map(([id]) => id)).toEqual([
      "p3",
      "p1",
    ])
    expect(members.get("p3")).toEqual(["x", "a"])
    expect(members.get("p1")).toEqual(["c"])
    expect(toast.success).toHaveBeenCalledExactlyOnceWith(
      'goals.toasts.goalsRemovedAndMoved:{"count":2,"project":"Proj","moved":1,"destination":"Dest"}'
    )
  })

  it("removeFromProject: a destination conflict stops before anything is removed", async () => {
    members.set("p1", ["a"])
    changeProjectMembership.mockRejectedValueOnce(new Error("slot"))
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    let ok = true
    await act(async () => {
      ok = await result.current.removeFromProject(
        [row("a", ["p1"])],
        project,
        destination
      )
    })
    expect(ok).toBe(false)
    expect(changeProjectMembership).toHaveBeenCalledTimes(1)
    expect(members.get("p1")).toEqual(["a"])
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("membership-error")
  })

  it("removeFromProject: says the goals were moved when only the removal fails", async () => {
    members.set("p1", ["a"])
    const apply = changeProjectMembership.getMockImplementation()!
    changeProjectMembership
      .mockImplementationOnce(apply)
      .mockRejectedValueOnce(new Error("network"))
    const { result } = renderHook(() => useGoalActions(), { wrapper })
    let ok = true
    await act(async () => {
      ok = await result.current.removeFromProject(
        [row("a", ["p1"])],
        project,
        destination
      )
    })
    expect(ok).toBe(false)
    expect(members.get("p3")).toEqual(["a"])
    expect(members.get("p1")).toEqual(["a"])
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      'goals.toasts.movedButNotRemoved:{"count":1,"project":"Proj","destination":"Dest","error":"membership-error"}'
    )
  })
})
