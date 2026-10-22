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
  deleteGoal,
  editGoal,
  getGoal,
  listGoals,
  updateGoalsStatus,
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
    const combined = { entityId: "hero", goals: [] } as never

    createCombinedGoals(combined)
    updateGoalsStatus({
      goalIds: ["goal-1", "goal-2"],
      status: "Completed",
      expectedOrderRevision: 4,
    })
    deleteGoal("goal-1")

    expect(api.post).toHaveBeenNthCalledWith(1, "/api/v1/me/goals", {
      body: combined,
    })
    expect(api.post).toHaveBeenNthCalledWith(2, "/api/v1/me/goals/status", {
      body: {
        goalIds: ["goal-1", "goal-2"],
        status: "Completed",
        expectedOrderRevision: 4,
      },
    })
    expect(api.delete).toHaveBeenCalledWith("/api/v1/me/goals/goal-1", {})
  })

  it("sends a target edit as the target section of the single edit route", () => {
    const target = {
      expectedRevision: 7,
      target: { rank: { end: 7, endPointFive: true, endAppliedUpgrades: 0 } },
    }

    editGoal("goal-1", { target })

    expect(api.put).toHaveBeenCalledWith("/api/v1/me/goals/goal-1", {
      body: { target },
    })
  })

  it("sends only the present sections of a goal edit", () => {
    editGoal("goal-1", { priority: { position: 2, expectedOrderRevision: 7 } })

    expect(api.put).toHaveBeenCalledWith("/api/v1/me/goals/goal-1", {
      body: { priority: { position: 2, expectedOrderRevision: 7 } },
    })
    expect(Object.keys(api.put.mock.calls[0][1].body)).toEqual(["priority"])
  })
})
