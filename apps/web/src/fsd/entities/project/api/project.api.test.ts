import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { lastRequest } from "@/test/last-request"

import {
  createProject,
  deleteProject,
  listProjects,
  moveProjectGoal,
  updateProject,
  updateProjectGoals,
} from "./project.api"

const fetchMock = () =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      Promise.resolve(new Response("{}", { status: 200 }))
    )

describe("project API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("maps project reads to their endpoints", async () => {
    const fetch = fetchMock()

    await listProjects(new AbortController().signal)

    expect(await lastRequest(fetch)).toMatchObject({
      method: "GET",
      url: "https://api.example/api/v1/projects",
    })
  })

  it("maps a project delete to its endpoint", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 204 }))
      )

    await deleteProject("project-1")
    expect(await lastRequest(fetch)).toMatchObject({
      method: "DELETE",
      url: "https://api.example/api/v1/projects/project-1",
    })

    await deleteProject("project-1", true)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "DELETE",
      url: "https://api.example/api/v1/projects/project-1?deleteGoals=true",
    })
  })

  it("maps project writes to their endpoints", async () => {
    const fetch = fetchMock()
    const create = { name: "Plan", description: null, color: null }
    const update = {
      name: "Updated",
      description: null,
      color: null,
      status: "Active" as const,
      revision: 2,
      target: null,
    }
    const goals = {
      goals: [{ goalId: "goal-1" }],
      expectedGoalIds: ["goal-2"],
    }
    const move = {
      goalId: "goal-1",
      displacedGoalId: "goal-2",
      expectedRevision: 4,
    }

    await createProject(create)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "POST",
      url: "https://api.example/api/v1/projects",
      body: create,
    })
    await updateProject("project-1", update)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: "https://api.example/api/v1/projects/project-1",
      body: update,
    })
    await updateProjectGoals("project-1", goals)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: "https://api.example/api/v1/projects/project-1/goals",
      body: goals,
    })
    await moveProjectGoal("project-1", move)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: "https://api.example/api/v1/projects/project-1/goal-order",
      body: move,
    })
  })
})
