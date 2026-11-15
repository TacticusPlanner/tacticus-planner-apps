import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { act, renderHook } from "@/test/render"

const editGoal = vi.hoisted(() => vi.fn())
vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  editGoal,
}))

import { useGoalEditSave } from "./use-goal-edit-save"

const listKey = ["goals", "list", { archived: false }]
const goal = (overrides: object = {}) => ({
  goalId: "a",
  status: "Active",
  notes: null,
  dependsOn: [],
  updatedAt: "2026-10-01T00:00:00Z",
  globalPriority: 1,
  projectIds: ["p1"],
  ...overrides,
})

let client: QueryClient
let invalidated: { queryKey: unknown[]; refetchType?: string }[]
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe("useGoalEditSave cache updates", () => {
  beforeEach(() => {
    client = new QueryClient()
    client.setQueryData(listKey, {
      orderRevision: 3,
      goals: [goal(), goal({ goalId: "b", globalPriority: 2 })],
    })
    invalidated = []
    vi.spyOn(client, "invalidateQueries").mockImplementation(
      async (filters?: {
        queryKey?: readonly unknown[]
        refetchType?: string
      }) => {
        invalidated.push({
          queryKey: [...(filters?.queryKey ?? [])],
          ...(filters?.refetchType ? { refetchType: filters.refetchType } : {}),
        })
      }
    )
    editGoal.mockReset()
  })

  const save = async (request: object) => {
    const { result } = renderHook(
      () => useGoalEditSave({ goalId: "a", onSaved: () => {} }),
      { wrapper }
    )
    await act(() => result.current.save(request))
  }
  const listGoal = (goalId: string) =>
    (
      client.getQueryData(listKey) as {
        goals: {
          goalId: string
          notes: string | null
          globalPriority: number
        }[]
      }
    ).goals.find((entry) => entry.goalId === goalId)

  it("a notes-only save writes the response into the detail and the goal lists and refetches nothing", async () => {
    const saved = goal({
      notes: "farm later",
      updatedAt: "2026-10-02T00:00:00Z",
    })
    editGoal.mockResolvedValue({ goal: saved })

    await save({ details: { notes: "farm later" } })

    expect(client.getQueryData(["goals", "detail", "a"])).toEqual(saved)
    expect(listGoal("a")?.notes).toBe("farm later")
    expect(invalidated).toEqual([])
  })

  it("a projects save refetches the project list only (its goalIds changed)", async () => {
    editGoal.mockResolvedValue({ goal: goal({ projectIds: ["p2"] }) })

    await save({ projectIds: ["p2"] })

    expect(invalidated).toEqual([{ queryKey: ["projects", "list"] }])
    expect(listGoal("a")).toMatchObject({ projectIds: ["p2"] })
  })

  it("a priority save applies the returned order and only marks the lists stale", async () => {
    editGoal.mockResolvedValue({
      goal: goal({ globalPriority: 2 }),
      order: { revision: 4, goalIds: ["b", "a"] },
    })

    await save({ priority: { position: 2, expectedOrderRevision: 3 } })

    expect(listGoal("a")?.globalPriority).toBe(2)
    expect(listGoal("b")?.globalPriority).toBe(1)
    expect(
      (client.getQueryData(listKey) as { orderRevision: number }).orderRevision
    ).toBe(4)
    expect(invalidated).toEqual([
      { queryKey: ["goals", "list"], refetchType: "none" },
    ])
  })
})
