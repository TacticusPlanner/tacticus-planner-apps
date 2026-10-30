import { describe, expect, it } from "vitest"

import { goalMenuMoves } from "./menu-moves"

const active = (goalId: string) => ({ goalId, status: "Active" })

describe("goalMenuMoves", () => {
  it("targets the neighbouring goals and the first goal", () => {
    const moves = goalMenuMoves(["a", "b", "c", "d"].map(active))

    expect(moves.get("a")).toEqual({ top: undefined, up: undefined, down: "b" })
    expect(moves.get("b")).toEqual({ top: undefined, up: "a", down: "c" })
    expect(moves.get("d")).toEqual({ top: "a", up: "c", down: undefined })
  })

  it("skips goals that hold no priority position", () => {
    const moves = goalMenuMoves([
      active("a"),
      { goalId: "done", status: "Completed" },
      { goalId: "p", status: "Paused" },
    ])

    expect(moves.has("done")).toBe(false)
    expect(moves.get("p")).toEqual({ top: undefined, up: "a", down: undefined })
  })

  it("offers nothing when fewer than two goals can move", () => {
    expect(goalMenuMoves([active("a")]).size).toBe(0)
  })
})
