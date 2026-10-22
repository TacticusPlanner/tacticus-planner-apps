import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, act } from "@/test/render"

import { ApiError } from "@/shared/api"
import { setTestAuth } from "@/test/auth"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const api = vi.hoisted(() => ({
  updateGoalsStatus: vi.fn(),
  deleteGoal: vi.fn(),
}))
vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  updateGoalsStatus: api.updateGoalsStatus,
  deleteGoal: api.deleteGoal,
}))
// Each project's membership, changed in place the way the single PUT would.
const members = new Map<string, string[]>()
const changeProjectMembership = vi.fn(
  async (
    projectId: string,
    _current: readonly string[],
    change: (current: readonly string[]) => string[]
  ) => {
    const before = members.get(projectId) ?? []
    const after = [...new Set(change(before))]
    members.set(projectId, after)
    return { before, after }
  }
)
vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  changeProjectMembership: (...a: Parameters<typeof changeProjectMembership>) =>
    changeProjectMembership(...a),
}))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) => `Unit ${id}`,
}))

import { useGoalActions } from "./use-goal-actions"

const listKey = ["goals", "list", { archived: false }]
const goal = (goalId: string, status = "Active", globalPriority = 1) => ({
  goalId,
  entityType: "Character",
  entityId: goalId,
  goalType: "Rank",
  status,
  globalPriority,
  projectIds: ["p1"],
  updatedAt: "2026-10-01T00:00:00Z",
  config: { rank: null },
})

let client: QueryClient
let invalidated: unknown[][]
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const project = { projectId: "p1", name: "Proj", goalIds: ["a"] } as never
const destination = { projectId: "p3", name: "Dest", goalIds: [] } as never
const row = (goalId: string, projectIds: string[]) =>
  ({
    goalId,
    entityType: "Character",
    entityId: goalId,
    goalType: "Rank",
    projects: projectIds.map((projectId) => ({ projectId })),
  }) as never

const listGoal = (goalId: string) =>
  (
    client.getQueryData(listKey) as { goals: ReturnType<typeof goal>[] }
  ).goals.find((entry) => entry.goalId === goalId)

describe("useGoalActions", () => {
  beforeEach(() => {
    setTestAuth({ authenticated: true })
    client = new QueryClient()
    client.setQueryData(listKey, {
      orderRevision: 7,
      goals: [goal("a", "Active", 1), goal("b", "Paused", 2)],
    })
    invalidated = []
    vi.spyOn(client, "invalidateQueries").mockImplementation(
      async (filters?: { queryKey?: readonly unknown[] }) => {
        invalidated.push([...(filters?.queryKey ?? [])])
      }
    )
    api.updateGoalsStatus.mockReset()
    api.deleteGoal.mockReset().mockResolvedValue(undefined)
    changeProjectMembership.mockClear()
    members.clear()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  describe("status", () => {
    it("sends a cascade as one request without an order revision for pause/resume, and writes every response", async () => {
      api.updateGoalsStatus.mockResolvedValue({
        goals: [goal("a", "Active", 1), goal("b", "Active", 2)],
        orderRevision: 7,
      })
      const { result } = renderHook(() => useGoalActions(), { wrapper })

      await act(() =>
        result.current.setStatus("a", "Active", "Paused", [
          { goalId: "b", previousStatus: "Paused" },
        ])
      )

      expect(api.updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["a", "b"],
        status: "Active",
      })
      expect(listGoal("b")?.status).toBe("Active")
      expect(client.getQueryData(["goals", "detail", "b"])).toMatchObject({
        status: "Active",
      })
      expect(invalidated).toEqual([])
    })

    it("carries the list's order revision when completing, then refetches the goal lists once", async () => {
      api.updateGoalsStatus.mockResolvedValue({
        goals: [goal("a", "Completed", 0)],
        orderRevision: 8,
      })
      const { result } = renderHook(() => useGoalActions(), { wrapper })

      await act(() => result.current.setStatus("a", "Completed", "Active"))

      expect(api.updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["a"],
        status: "Completed",
        expectedOrderRevision: 7,
      })
      expect(
        (client.getQueryData(listKey) as { orderRevision: number })
          .orderRevision
      ).toBe(8)
      expect(invalidated).toEqual([["goals", "list"]])
    })

    it("reverts every optimistic row of a rejected bulk change and names the goal holding the slot once", async () => {
      api.updateGoalsStatus.mockRejectedValue(
        new ApiError(409, "Occupied", {
          issueCode: "slotOccupied",
          current: goal("z", "Active", 3),
        })
      )
      const { result } = renderHook(() => useGoalActions(), { wrapper })

      await act(() =>
        result.current.setStatusMany(
          [
            { goalId: "a", previousStatus: "Active" },
            { goalId: "b", previousStatus: "Paused" },
          ],
          "Paused"
        )
      )

      expect(api.updateGoalsStatus).toHaveBeenCalledTimes(1)
      expect(listGoal("a")?.status).toBe("Active")
      expect(listGoal("b")?.status).toBe("Paused")
      expect(toast.error).toHaveBeenCalledTimes(1)
      const message = String(vi.mocked(toast.error).mock.calls[0]![0])
      expect(message).toBe(
        "Unit a · Rank could not change: Unit z already has an active or paused Rank goal."
      )
      expect(message).toContain("Unit z")
      expect(message).not.toContain("Proj")
    })

    it("offers a reload when the order went stale", async () => {
      api.updateGoalsStatus.mockRejectedValue(
        new ApiError(409, "Stale", {
          issueCode: "goalOrderStale",
          current: { revision: 9, goalIds: ["a"] },
        })
      )
      const { result } = renderHook(() => useGoalActions(), { wrapper })

      await act(() => result.current.setStatus("a", "Archived", "Active"))

      const options = vi.mocked(toast.error).mock.calls[0]![1] as unknown as {
        action: { onClick: () => void }
      }
      options.action.onClick()
      expect(invalidated).toEqual([["goals", "list"]])
    })
  })

  describe("delete", () => {
    it("drops the rows and refetches the goal lists once; a failure reports once", async () => {
      api.deleteGoal.mockImplementation((id: string) =>
        id === "b" ? Promise.reject(new Error("x")) : Promise.resolve()
      )
      const { result } = renderHook(() => useGoalActions(), { wrapper })

      await act(() => result.current.removeMany(["a", "b"]))

      expect(api.deleteGoal).toHaveBeenCalledTimes(2)
      expect(listGoal("a")).toBeUndefined()
      expect(invalidated).toEqual([["goals", "list"]])
      expect(toast.error).toHaveBeenCalledTimes(1)
      expect(toast.success).not.toHaveBeenCalled()
    })
  })

  describe("membership", () => {
    it("adds the selection in one request from the project's goalIds and patches the goals' projectIds", async () => {
      members.set("p1", ["a"])
      const { result } = renderHook(() => useGoalActions(), { wrapper })

      await act(() =>
        result.current.addToProject([{ goalId: "a" }, { goalId: "b" }], {
          projectId: "p2",
          name: "Two",
          goalIds: [],
        } as never)
      )

      expect(changeProjectMembership).toHaveBeenCalledTimes(1)
      expect(changeProjectMembership.mock.calls[0]![1]).toEqual([])
      expect(listGoal("b")?.projectIds).toEqual(["p1", "p2"])
      expect(invalidated).toEqual([["projects", "list"]])
      expect(toast.success).toHaveBeenCalledExactlyOnceWith(
        "Added 2 goals to Two."
      )
    })

    it("moves last-membership rows to the destination before removing", async () => {
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
      expect(listGoal("a")?.projectIds).toEqual(["p3"])
      expect(toast.success).toHaveBeenCalledExactlyOnceWith(
        "Removed 2 goals from Proj; 1 moved to Dest."
      )
    })

    it("says the goals were moved when only the removal fails", async () => {
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
      expect(toast.error).toHaveBeenCalledExactlyOnceWith(
        "Added 1 goal to Dest, but couldn't remove it from Proj: Something went wrong. Please try again."
      )
    })
  })
})
