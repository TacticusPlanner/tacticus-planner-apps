import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ goals: vi.fn(), list: vi.fn() }))

vi.mock("./project.api", () => ({
  listProjectGoals: api.goals,
  listProjects: api.list,
}))

import { projectQueries } from "./project.queries"

describe("project queries", () => {
  it("builds account-scoped keys and delegates query functions", async () => {
    const signal = new AbortController().signal
    const list = projectQueries.list("account-1")
    const goals = projectQueries.goals("account-1", "project-1")

    await list.queryFn?.({ signal } as never)
    await goals.queryFn?.({ signal } as never)

    expect(projectQueries.all("account-1")).toEqual([
      "account",
      "account-1",
      "projects",
    ])
    expect(list.queryKey).toEqual(["account", "account-1", "projects", "list"])
    expect(goals.queryKey).toEqual([
      "account",
      "account-1",
      "projects",
      "detail",
      "project-1",
      "goals",
    ])
    expect(api.list).toHaveBeenCalledWith(signal)
    expect(api.goals).toHaveBeenCalledWith("project-1", signal)
  })
})
