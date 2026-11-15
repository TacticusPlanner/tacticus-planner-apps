// @vitest-environment jsdom
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

import { goalQueries } from "@/entities/goal"
import type { GoalDetail, GoalListResponse } from "@/entities/goal"
import { ApiError } from "@/shared/api"
import { useMoveProjectGoals } from "./use-move-project-goals"

const { updateGoalOrderMock } = vi.hoisted(() => ({
  updateGoalOrderMock: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  updateGoalOrder: updateGoalOrderMock,
}))

// The spec's worked example: A (Team Lavi), B (GW S29), C (Chaos Core), D (GW S29),
// E (Chaos Core, Paused), F (Team Lavi).
const IDS = ["A", "B", "C", "D", "E", "F"]

function goal(goalId: string, globalPriority: number): GoalDetail {
  return {
    goalId,
    entityType: "Character",
    entityId: `unit-${goalId}`,
    goalType: "Rank",
    status: goalId === "E" ? "Paused" : "Active",
    notes: null,
    dependsOn: [],
    linkedGoalIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    globalPriority,
    config: {} as GoalDetail["config"],
    snapshot: null,
    projectIds: [],
    revision: 1,
  }
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData<GoalListResponse>(goalQueries.list(false).queryKey, {
    goals: IDS.map((id, index) => goal(id, index + 1)),
    orderRevision: 4,
  })
  vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return {
    queryClient,
    ...renderHook(() => useMoveProjectGoals(), { wrapper }),
  }
}

const cachedIds = (queryClient: QueryClient) =>
  queryClient
    .getQueryData<GoalListResponse>(goalQueries.list(false).queryKey)!
    .goals.map((entry) => entry.goalId)

const stale = (goalIds: string[]) =>
  new ApiError(409, "stale", {
    issueCode: "goalOrderStale",
    current: { revision: 9, goalIds },
  })

/** The `action` of the last success toast (the Undo). */
const undoAction = () => {
  const options = vi.mocked(toast.success).mock.calls.at(-1)![1] as {
    action: { label: string; onClick: () => void }
    duration: number
  }
  return options
}

describe("useMoveProjectGoals", () => {
  beforeEach(() => {
    updateGoalOrderMock.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("saves the project's goals first in one request and announces the move", async () => {
    updateGoalOrderMock.mockImplementation((goalIds: string[]) =>
      Promise.resolve({ goalIds, revision: 5 })
    )
    const { result, queryClient } = setup()

    let saved = false
    await act(async () => {
      saved = await result.current.moveToTop(["E", "C"])
    })

    expect(saved).toBe(true)
    expect(updateGoalOrderMock).toHaveBeenCalledExactlyOnceWith(
      ["C", "E", "A", "B", "D", "F"],
      4
    )
    expect(cachedIds(queryClient)).toEqual(["C", "E", "A", "B", "D", "F"])
    // The Paused goal moved and is still Paused.
    expect(
      queryClient
        .getQueryData<GoalListResponse>(goalQueries.list(false).queryKey)!
        .goals.find((entry) => entry.goalId === "E")?.status
    ).toBe("Paused")
    expect(toast.success).toHaveBeenCalledWith(
      'goals.order.projectMove.moved:{"count":2}',
      expect.objectContaining({ duration: 10_000 })
    )
    expect(undoAction().action.label).toBe("goals.order.projectMove.undo")
  })

  it("sends nothing when the block is already first", async () => {
    const { result } = setup()

    let saved = true
    await act(async () => {
      saved = await result.current.moveToTop(["A", "B"])
    })

    expect(saved).toBe(false)
    expect(updateGoalOrderMock).not.toHaveBeenCalled()
  })

  it("restores the previous order on Undo with the revision the move returned", async () => {
    updateGoalOrderMock.mockImplementation((goalIds: string[]) =>
      Promise.resolve({
        goalIds,
        revision: updateGoalOrderMock.mock.calls.length + 4,
      })
    )
    const { result, queryClient } = setup()
    await act(async () => {
      await result.current.moveToTop(["C", "E"])
    })

    await act(async () => {
      undoAction().action.onClick()
      await vi.waitFor(() =>
        expect(updateGoalOrderMock).toHaveBeenCalledTimes(2)
      )
    })

    expect(updateGoalOrderMock).toHaveBeenLastCalledWith(IDS, 5)
    await vi.waitFor(() => expect(cachedIds(queryClient)).toEqual(IDS))
    expect(toast.success).toHaveBeenLastCalledWith(
      "goals.order.projectMove.undone"
    )
  })

  it("changes nothing on Undo when the order changed since", async () => {
    const later = ["A", "C", "E", "B", "D", "F"]
    updateGoalOrderMock
      .mockImplementationOnce((goalIds: string[]) =>
        Promise.resolve({ goalIds, revision: 5 })
      )
      .mockRejectedValueOnce(stale(later))
    const { result, queryClient } = setup()
    await act(async () => {
      await result.current.moveToTop(["C", "E"])
    })

    await act(async () => {
      undoAction().action.onClick()
      await vi.waitFor(() =>
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(
          "goals.order.projectMove.staleUndo"
        )
      )
    })

    expect(cachedIds(queryClient)).toEqual(later)
  })

  it("adopts the current order and says so when the move itself is stale", async () => {
    const current = ["B", "A", "C", "D", "E", "F"]
    updateGoalOrderMock.mockRejectedValueOnce(stale(current))
    const { result, queryClient } = setup()

    let saved = true
    await act(async () => {
      saved = await result.current.moveToTop(["C", "E"])
    })

    expect(saved).toBe(false)
    expect(cachedIds(queryClient)).toEqual(current)
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "goals.order.projectMove.staleMove"
    )
    expect(toast.success).not.toHaveBeenCalled()
  })
})
