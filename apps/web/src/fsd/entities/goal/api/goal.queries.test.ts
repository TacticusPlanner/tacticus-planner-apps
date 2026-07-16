import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ get: vi.fn(), list: vi.fn() }))

vi.mock("./goal.api", () => ({ getGoal: api.get, listGoals: api.list }))

import { goalQueries } from "./goal.queries"

describe("goal queries", () => {
  it("builds account-scoped hierarchy keys", () => {
    expect(goalQueries.all("account-1")).toEqual([
      "account",
      "account-1",
      "goals",
    ])
    expect(goalQueries.lists("account-1")).toEqual([
      "account",
      "account-1",
      "goals",
      "list",
    ])
    expect(goalQueries.details("account-1")).toEqual([
      "account",
      "account-1",
      "goals",
      "detail",
    ])
  })

  it("delegates list and detail query functions", async () => {
    const signal = new AbortController().signal
    const list = goalQueries.list("account-1", true)
    const detail = goalQueries.detail("account-1", "goal-1")

    await list.queryFn?.({ signal } as never)
    await detail.queryFn?.({ signal } as never)

    expect(list.queryKey).toEqual([
      "account",
      "account-1",
      "goals",
      "list",
      { archived: true },
    ])
    expect(api.list).toHaveBeenCalledWith({ archived: true, signal })
    expect(api.get).toHaveBeenCalledWith("goal-1", signal)
  })
})
