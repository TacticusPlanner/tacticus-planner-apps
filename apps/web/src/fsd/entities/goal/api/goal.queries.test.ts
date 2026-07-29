import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ get: vi.fn(), list: vi.fn() }))

vi.mock("./goal.api", () => ({ getGoal: api.get, listGoals: api.list }))

import { goalQueries } from "./goal.queries"

describe("goal queries", () => {
  it("builds resource hierarchy keys", () => {
    expect(goalQueries.all()).toEqual(["goals"])
    expect(goalQueries.lists()).toEqual(["goals", "list"])
    expect(goalQueries.details()).toEqual(["goals", "detail"])
  })

  it("delegates list and detail query functions", async () => {
    const signal = new AbortController().signal
    const list = goalQueries.list(true)
    const detail = goalQueries.detail("goal-1")

    await list.queryFn?.({ signal } as never)
    await detail.queryFn?.({ signal } as never)

    expect(list.queryKey).toEqual(["goals", "list", { archived: true }])
    expect(api.list).toHaveBeenCalledWith({ archived: true, signal })
    expect(api.get).toHaveBeenCalledWith("goal-1", signal)
  })
})
