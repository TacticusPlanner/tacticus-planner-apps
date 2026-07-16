import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@/shared/api", () => ({
  apiDelete: api.delete,
  apiGet: api.get,
  apiPost: api.post,
  apiPut: api.put,
}))

import {
  createCombinedGoals,
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  updateGoal,
  updateGoalStatus,
} from "./goal.api"

describe("goal API", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps goal reads to their endpoints", () => {
    const signal = new AbortController().signal

    listGoals({ signal })
    listGoals({ archived: true, signal })
    getGoal("goal-1", signal)

    expect(api.get).toHaveBeenNthCalledWith(1, "/api/v1/me/goals", {
      signal,
    })
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/me/goals?archived=true",
      { signal }
    )
    expect(api.get).toHaveBeenNthCalledWith(3, "/api/v1/me/goals/goal-1", {
      signal,
    })
  })

  it("maps goal writes to their endpoints", () => {
    const create = { entityId: "hero", entityType: "Character" } as never
    const combined = { entityId: "hero", goals: [] } as never
    const update = { notes: "note" } as never

    createGoal(create)
    createCombinedGoals(combined)
    updateGoal("goal-1", update)
    updateGoalStatus("goal-1", "Paused")
    deleteGoal("goal-1")

    expect(api.post).toHaveBeenNthCalledWith(1, "/api/v1/me/goals", {
      body: create,
    })
    expect(api.post).toHaveBeenNthCalledWith(2, "/api/v1/me/goals/combined", {
      body: combined,
    })
    expect(api.put).toHaveBeenCalledWith("/api/v1/me/goals/goal-1", {
      body: update,
    })
    expect(api.post).toHaveBeenNthCalledWith(
      3,
      "/api/v1/me/goals/goal-1/status",
      { body: { status: "Paused" } }
    )
    expect(api.delete).toHaveBeenCalledWith("/api/v1/me/goals/goal-1", {})
  })
})
