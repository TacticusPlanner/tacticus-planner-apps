import type { ReactNode } from "react"
import { act, renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

const createCombinedGoals = vi.fn()

vi.mock("@/entities/goal", () => ({
  buildCreateGoalSnapshot: () => null,
  createCombinedGoals: (...args: unknown[]) => createCombinedGoals(...args),
  goalQueries: {
    lists: () => ["goals", "list"],
    detail: (id: string) => ({ queryKey: ["goals", "detail", id] }),
  },
  goalTargetLabel: (
    _t: unknown,
    goal: { goalType: string; config: { rank?: { end: number } | null } }
  ) =>
    goal.goalType === "Rank" && goal.config.rank
      ? `Rank${goal.config.rank.end}`
      : null,
}))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) => `Unit ${id}`,
}))
vi.mock("./goal-spec-builder", () => ({
  buildCombinedGoalSpecs: () => [
    { goalType: "Rank", config: {}, dependsOnIndex: [] },
  ],
}))

import { ApiError } from "@/shared/api"

import { useGoalSubmit } from "./use-goal-submit"

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

describe("useGoalSubmit conflicts", () => {
  beforeEach(() => vi.clearAllMocks())

  it("keeps the form open and names the occupied Rank target when another session took it first", async () => {
    createCombinedGoals.mockRejectedValue(
      new ApiError(409, "occupied", {
        issueCode: "slotOccupied",
        current: {
          goalId: "goal-existing",
          entityType: "Character",
          entityId: "bellator",
          goalType: "Rank",
          config: {
            rank: { end: 11, endPointFive: false, endAppliedUpgrades: 0 },
          },
        },
      })
    )
    const onOpenChange = vi.fn()
    const resetForm = vi.fn()
    const { result } = renderHook(
      () =>
        useGoalSubmit({
          entityId: "bellator" as never,
          entityType: "Character",
          canSubmit: true,
          selectedProjects: [{ projectId: "project-1" }],
          specParams: {} as never,
          startPaused: false,
          snapshotContext: {} as never,
          onOpenChange,
          resetForm,
        }),
      { wrapper }
    )

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as never)
    })

    // The error state is read from the mutation, which reports it on its next notification.
    await vi.waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.errorMessage).toBe(
      "Unit bellator already has an active or paused Rank goal with the target Rank11."
    )
    // Nothing was closed or reset, so the user's draft is still on screen.
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(resetForm).not.toHaveBeenCalled()
  })
})

describe("useGoalSubmit cache updates", () => {
  beforeEach(() => vi.clearAllMocks())

  it("writes each created goal and refetches only the goal lists and the project list", async () => {
    const created = [
      { goalId: "g1", projectIds: ["p1"] },
      { goalId: "g2", projectIds: ["p1", "p2"] },
    ]
    createCombinedGoals.mockResolvedValue({ goals: created })
    const client = new QueryClient()
    const invalidate = vi
      .spyOn(client, "invalidateQueries")
      .mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const { result } = renderHook(
      () =>
        useGoalSubmit({
          entityId: "bellator" as never,
          entityType: "Character",
          canSubmit: true,
          selectedProjects: [{ projectId: "p1" }],
          specParams: {} as never,
          startPaused: false,
          snapshotContext: {} as never,
          onOpenChange,
          resetForm: vi.fn(),
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      }
    )

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never)
    })

    expect(client.getQueryData(["goals", "detail", "g2"])).toEqual(created[1])
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual(
      [
        ["goals", "list"],
        ["projects", "list"],
      ]
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
