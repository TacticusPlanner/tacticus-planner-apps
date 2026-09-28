import { createElement, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

import {
  goalQueries,
  type GoalListResponse,
  type GoalSummary,
} from "@/entities/goal"
import { projectQueries, type ProjectGoalsResponse } from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useGoalOrderActions } from "./use-goal-order-actions"

const { updateGoalOrderMock, moveProjectGoalMock } = vi.hoisted(() => ({
  updateGoalOrderMock: vi.fn(),
  moveProjectGoalMock: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  updateGoalOrder: updateGoalOrderMock,
}))
vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  moveProjectGoal: moveProjectGoalMock,
}))

const IDS = ["a", "b", "c", "d", "e"]

function summary(goalId: string, globalPriority: number): GoalSummary {
  return {
    goalId,
    entityType: "Character",
    entityId: `unit-${goalId}`,
    goalType: "Rank",
    status: "Active",
    notes: null,
    dependsOn: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    globalPriority,
  }
}

const globalList = (): GoalListResponse => ({
  goals: IDS.map((id, index) => summary(id, index + 1)),
  orderRevision: 4,
})

// The project holds A, C and E of the global order A,B,C,D,E.
const projectList = (): ProjectGoalsResponse => ({
  goals: ["a", "c", "e"].map((id) => ({
    goal: summary(id, IDS.indexOf(id) + 1),
  })),
  orderRevision: 4,
})

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(goalQueries.list(false).queryKey, globalList())
  queryClient.setQueryData(projectQueries.goals("p1").queryKey, projectList())
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return {
    queryClient,
    ...renderHook(() => useGoalOrderActions(), { wrapper }),
  }
}

const cachedGlobal = (queryClient: QueryClient) =>
  queryClient.getQueryData<GoalListResponse>(goalQueries.list(false).queryKey)!
const cachedProject = (queryClient: QueryClient) =>
  queryClient.getQueryData<ProjectGoalsResponse>(
    projectQueries.goals("p1").queryKey
  )!

describe("useGoalOrderActions", () => {
  beforeEach(() => {
    updateGoalOrderMock
      .mockReset()
      .mockResolvedValue({ revision: 5, goalIds: [] })
    moveProjectGoalMock
      .mockReset()
      .mockResolvedValue({ revision: 5, goalIds: [] })
    vi.mocked(toast.error).mockReset()
  })

  it("moves a goal from the Goals page and submits the complete order at the loaded revision", async () => {
    const { result } = setup()

    let ok!: boolean
    await act(async () => {
      ok = await result.current.moveGoal({ goalId: "e", displacedGoalId: "c" })
    })

    expect(ok).toBe(true)
    expect(updateGoalOrderMock).toHaveBeenCalledWith(
      ["a", "b", "e", "c", "d"],
      4
    )
  })

  it("moves a project goal, rewriting the global list and the projection before the request resolves", async () => {
    let resolveRequest!: () => void
    moveProjectGoalMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRequest = resolve
      })
    )
    const { result, queryClient } = setup()

    let moving!: Promise<boolean>
    act(() => {
      moving = result.current.moveGoal({
        goalId: "e",
        displacedGoalId: "c",
        projectId: "p1",
      })
    })

    await waitFor(() =>
      expect(
        cachedGlobal(queryClient).goals.map((goal) => goal.goalId)
      ).toEqual(["a", "b", "e", "c", "d"])
    )
    expect(
      cachedProject(queryClient).goals.map((entry) => entry.goal.goalId)
    ).toEqual(["a", "e", "c"])
    expect(cachedGlobal(queryClient).orderRevision).toBe(5)
    expect(moveProjectGoalMock).toHaveBeenCalledWith("p1", {
      goalId: "e",
      displacedGoalId: "c",
      expectedRevision: 4,
    })

    await act(async () => {
      resolveRequest()
      await moving
    })
  })

  it("moves the displayed priority numbers with the order, on both views, and restores them on rejection", async () => {
    let rejectRequest!: (error: Error) => void
    moveProjectGoalMock.mockReturnValue(
      new Promise<void>((_, reject) => {
        rejectRequest = reject
      })
    )
    const { result, queryClient } = setup()
    const numbers = () => ({
      global: cachedGlobal(queryClient).goals.map(
        (goal) => `${goal.goalId}${goal.globalPriority}`
      ),
      project: cachedProject(queryClient).goals.map(
        (entry) => `${entry.goal.goalId}${entry.goal.globalPriority}`
      ),
    })

    let moving!: Promise<boolean>
    act(() => {
      moving = result.current.moveGoal({
        goalId: "e",
        displacedGoalId: "c",
        projectId: "p1",
      })
    })

    // Project A,C,E; E onto C: A 1, E 3, C 4 there, and A 1, B 2, E 3, C 4, D 5 account-wide.
    await waitFor(() =>
      expect(numbers()).toEqual({
        global: ["a1", "b2", "e3", "c4", "d5"],
        project: ["a1", "e3", "c4"],
      })
    )

    await act(async () => {
      rejectRequest(new Error("boom"))
      await moving
    })

    expect(numbers()).toEqual({
      global: ["a1", "b2", "c3", "d4", "e5"],
      project: ["a1", "c3", "e5"],
    })
  })

  it("moves a project goal down onto the goal it displaces", async () => {
    const { result, queryClient } = setup()
    moveProjectGoalMock.mockReturnValue(new Promise(() => undefined))

    act(() => {
      void result.current.moveGoal({
        goalId: "c",
        displacedGoalId: "e",
        projectId: "p1",
      })
    })

    await waitFor(() =>
      expect(
        cachedGlobal(queryClient).goals.map((goal) => goal.goalId)
      ).toEqual(["a", "b", "d", "e", "c"])
    )
  })

  it("rolls back and keeps the attempted move when the order changed under the user", async () => {
    moveProjectGoalMock.mockRejectedValueOnce(
      new ApiError(409, "The goal order changed since it was loaded.", {
        issueCode: "goalOrderStale",
        message: "The goal order changed since it was loaded.",
        revision: 6,
        goalIds: IDS,
      })
    )
    const { result, queryClient } = setup()

    await act(async () => {
      await result.current.moveGoal({
        goalId: "e",
        displacedGoalId: "c",
        projectId: "p1",
      })
    })

    expect(cachedGlobal(queryClient).goals.map((goal) => goal.goalId)).toEqual(
      IDS
    )
    expect(result.current.conflict?.move).toEqual({
      goalId: "e",
      displacedGoalId: "c",
      projectId: "p1",
    })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("retries the kept move only when asked, against the refreshed revision", async () => {
    moveProjectGoalMock.mockRejectedValueOnce(
      new ApiError(409, "stale", {
        issueCode: "goalOrderStale",
        message: "stale",
        revision: 6,
        goalIds: IDS,
      })
    )
    const { result, queryClient } = setup()
    await act(async () => {
      await result.current.moveGoal({
        goalId: "e",
        displacedGoalId: "c",
        projectId: "p1",
      })
    })
    expect(moveProjectGoalMock).toHaveBeenCalledTimes(1)

    // The refreshed caches carry the newer revision.
    queryClient.setQueryData(projectQueries.goals("p1").queryKey, {
      ...projectList(),
      orderRevision: 6,
    })
    await act(async () => {
      await result.current.retry()
    })

    expect(moveProjectGoalMock).toHaveBeenCalledTimes(2)
    expect(moveProjectGoalMock).toHaveBeenLastCalledWith("p1", {
      goalId: "e",
      displacedGoalId: "c",
      expectedRevision: 6,
    })
    expect(result.current.conflict).toBeNull()
  })

  it("rolls back and reports any other failure without recording a conflict", async () => {
    updateGoalOrderMock.mockRejectedValueOnce(new ApiError(500, "boom"))
    const { result, queryClient } = setup()

    await act(async () => {
      await result.current.moveGoal({ goalId: "e", displacedGoalId: "c" })
    })

    expect(cachedGlobal(queryClient).goals.map((goal) => goal.goalId)).toEqual(
      IDS
    )
    expect(toast.error).toHaveBeenCalledWith("boom")
    expect(result.current.conflict).toBeNull()
  })

  it("sends overlapping gestures one at a time, each at the revision the previous one advanced", async () => {
    let releaseFirst!: () => void
    updateGoalOrderMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        releaseFirst = resolve
      })
    )
    const { result } = setup()

    let first!: Promise<boolean>
    let second!: Promise<boolean>
    await act(async () => {
      first = result.current.moveGoal({ goalId: "e", displacedGoalId: "c" })
      second = result.current.moveGoal({ goalId: "a", displacedGoalId: "b" })
      await Promise.resolve()
    })
    expect(updateGoalOrderMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      releaseFirst()
      await Promise.all([first, second])
    })

    expect(updateGoalOrderMock).toHaveBeenNthCalledWith(
      1,
      ["a", "b", "e", "c", "d"],
      4
    )
    expect(updateGoalOrderMock).toHaveBeenNthCalledWith(
      2,
      ["b", "a", "e", "c", "d"],
      5
    )
  })

  it("shifts the members of a project that holds only one of the moved pair", async () => {
    const { result, queryClient } = setup()
    // Project p2 holds B, D and E of the global order A,B,C,D,E - not C, the goal E displaces.
    queryClient.setQueryData(projectQueries.goals("p2").queryKey, {
      goals: ["b", "d", "e"].map((id) => ({
        goal: summary(id, IDS.indexOf(id) + 1),
      })),
      orderRevision: 4,
    } satisfies ProjectGoalsResponse)
    updateGoalOrderMock.mockReturnValue(new Promise(() => undefined))

    act(() => {
      void result.current.moveGoal({ goalId: "e", displacedGoalId: "c" })
    })

    const p2 = queryClient.getQueryData<ProjectGoalsResponse>(
      projectQueries.goals("p2").queryKey
    )!
    // The global order becomes A,B,E,C,D: E takes C's position 3 and D moves to 5; B is above the move.
    expect(p2.goals.map((entry) => entry.goal.goalId)).toEqual(["b", "e", "d"])
    expect(p2.goals.map((entry) => entry.goal.globalPriority)).toEqual([
      2, 3, 5,
    ])
  })

  it("refetches the order once, after the last overlapping gesture, and never refetches goal details", async () => {
    const { result, queryClient } = setup()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    await act(async () => {
      const first = result.current.moveGoal({
        goalId: "e",
        displacedGoalId: "c",
      })
      const second = result.current.moveGoal({
        goalId: "a",
        displacedGoalId: "b",
      })
      await Promise.all([first, second])
    })

    const keys = invalidate.mock.calls.map((call) => call[0])
    // One refresh: the order lists, the project projections, and details only marked stale.
    expect(keys).toHaveLength(3)
    expect(keys).toContainEqual({ queryKey: goalQueries.lists() })
    expect(keys).toContainEqual({
      queryKey: goalQueries.details(),
      refetchType: "none",
    })
  })

  it("does nothing for a goal moved onto itself or one that left the order", async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.moveGoal({ goalId: "a", displacedGoalId: "a" })
      await result.current.moveGoal({ goalId: "a", displacedGoalId: "zzz" })
    })

    expect(updateGoalOrderMock).not.toHaveBeenCalled()
    expect(moveProjectGoalMock).not.toHaveBeenCalled()
  })
})
