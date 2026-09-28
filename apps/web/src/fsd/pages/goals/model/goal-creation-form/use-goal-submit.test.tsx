import type { ReactNode } from "react"
import { act, renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

const createCombinedGoals = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && "defaultValue" in options
        ? String(options.defaultValue)
        : options
          ? `${key}:${JSON.stringify(options)}`
          : key,
  }),
}))
vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    readonly status: number
    readonly details: unknown

    constructor(status: number, message: string, details?: unknown) {
      super(message)
      this.status = status
      this.details = details
    }
  },
}))
vi.mock("@/entities/goal", () => ({
  buildCreateGoalSnapshot: () => null,
  createCombinedGoals: (...args: unknown[]) => createCombinedGoals(...args),
  describeRankTargetKey: (key: string) => {
    const [end, slots] = key.split(":").map(Number)
    return { rank: `Rank${end}`, slots }
  },
}))
vi.mock("../estimate/goal-spec-builder", () => ({
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
        issueCode: "projectGoalSlotOccupied",
        message: "occupied",
        projectId: "project-1",
        projectName: "Plan A",
        entityType: "Character",
        entityId: "bellator",
        goalType: "Rank",
        existingGoalId: "goal-existing",
        normalizedTarget: "11:0",
      })
    )
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
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
          onCreated,
          resetForm,
        }),
      { wrapper }
    )

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: () => {},
      } as never)
    })

    expect(result.current.status).toBe("error")
    expect(result.current.errorMessage).toBe(
      'goals.project.membershipConflictRank:{"project":"Plan A","target":"Rank11"}'
    )
    // Nothing was closed or reset, so the user's draft is still on screen.
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
    expect(resetForm).not.toHaveBeenCalled()
  })
})
