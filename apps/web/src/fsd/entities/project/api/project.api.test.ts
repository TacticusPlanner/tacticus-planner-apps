import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@/shared/api", () => ({
  apiGet: api.get,
  apiPost: api.post,
  apiPut: api.put,
}))

import {
  activateProject,
  createProject,
  listProjectGoals,
  listProjects,
  updateProject,
  updateProjectGoals,
  updateProjectGoalsStatus,
  updateProjectUnitOrder,
} from "./project.api"

describe("project API", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps project reads to their endpoints", () => {
    const signal = new AbortController().signal

    listProjects(signal)
    listProjectGoals("project-1", signal)

    expect(api.get).toHaveBeenNthCalledWith(1, "/api/v1/me/projects", {
      signal,
    })
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/me/projects/project-1/goals",
      { signal }
    )
  })

  it("maps project writes to their endpoints", () => {
    const create = { name: "Plan" }
    const update = { name: "Updated" } as never
    const goals = [{ goalId: "goal-1", priority: 1 }]

    createProject(create)
    updateProject("project-1", update)
    activateProject("project-1")
    updateProjectGoals("project-1", goals)
    updateProjectGoalsStatus("project-1", "Paused")
    const units = [
      { entityType: "Character" as const, entityId: "ragnar" },
      { entityType: "Mow" as const, entityId: "forgefiend" },
    ]
    updateProjectUnitOrder("project-1", units)

    expect(api.post).toHaveBeenNthCalledWith(1, "/api/v1/me/projects", {
      body: create,
    })
    expect(api.put).toHaveBeenNthCalledWith(
      1,
      "/api/v1/me/projects/project-1",
      { body: update }
    )
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/me/projects/project-1/activate",
      {}
    )
    expect(api.put).toHaveBeenNthCalledWith(
      2,
      "/api/v1/me/projects/project-1/goals",
      { body: { goals } }
    )
    expect(api.post).toHaveBeenNthCalledWith(
      3,
      "/api/v1/me/projects/project-1/goals/status",
      { body: { status: "Paused" } }
    )
    expect(api.put).toHaveBeenNthCalledWith(
      3,
      "/api/v1/me/projects/project-1/unit-order",
      { body: { units } }
    )
  })
})
