import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock("./project.api", () => ({
  listProjects: api.list,
}))

import { projectQueries } from "./project.queries"

describe("project queries", () => {
  it("builds the list key and delegates its query", async () => {
    const signal = new AbortController().signal
    const list = projectQueries.list()

    await list.queryFn?.({ signal } as never)

    expect(projectQueries.all()).toEqual(["projects"])
    expect(list.queryKey).toEqual(["projects", "list"])
    expect(api.list).toHaveBeenCalledWith(signal)
  })

  it("has no per-project member read (membership comes from the list)", () => {
    expect(Object.keys(projectQueries).sort()).toEqual(["all", "list"])
  })
})
