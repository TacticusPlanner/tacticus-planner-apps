import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ goals: vi.fn(), list: vi.fn() }))

vi.mock("./project.api", () => ({
  listProjectGoals: api.goals,
  listProjects: api.list,
}))

import { projectQueries } from "./project.queries"

describe("project queries", () => {
  it("builds resource keys and delegates query functions", async () => {
    const signal = new AbortController().signal
    const list = projectQueries.list()
    const goals = projectQueries.goals("project-1")

    await list.queryFn?.({ signal } as never)
    await goals.queryFn?.({ signal } as never)

    expect(projectQueries.all()).toEqual(["projects"])
    expect(list.queryKey).toEqual(["projects", "list"])
    expect(projectQueries.details()).toEqual(["projects", "detail"])
    expect(goals.queryKey).toEqual([
      ...projectQueries.details(),
      "project-1",
      "goals",
    ])
    expect(api.list).toHaveBeenCalledWith(signal)
    expect(api.goals).toHaveBeenCalledWith("project-1", signal)
  })
})
