import { describe, expect, it } from "vitest"

import { displacedForPriority, goalMenuMoves } from "./menu-moves"

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
  it("shares the complete priority order with every visible in-flight row", () => {
    const order = ["a", "hidden", "b"]
    const moves = goalMenuMoves([active("a"), active("b")], order)

    expect(moves.get("a")?.priorityOrder).toBe(order)
    expect(moves.get("b")).toEqual({
      top: undefined,
      up: "a",
      down: undefined,
      priorityOrder: order,
    })
  })

  it("offers the priority order alone when the filters show one goal", () => {
    const moves = goalMenuMoves([active("b")], ["a", "b"])

    expect(moves.get("b")).toEqual({ priorityOrder: ["a", "b"] })
  })

  it("offers no priority order when only one goal holds a position", () => {
    expect(goalMenuMoves([active("a")], ["a"]).size).toBe(0)
  })
})

describe("displacedForPriority", () => {
  const order = ["a", "b", "c"]

  it("targets the goal holding that priority", () => {
    expect(displacedForPriority(order, "c", 1)).toBe("a")
    expect(displacedForPriority(order, "a", 3)).toBe("c")
  })

  it("has no target for the current place or an invalid value", () => {
    expect(displacedForPriority(order, "b", 2)).toBeUndefined()
    expect(displacedForPriority(order, "b", 0)).toBeUndefined()
    expect(displacedForPriority(order, "b", 4)).toBeUndefined()
    expect(displacedForPriority(order, "b", 1.5)).toBeUndefined()
    expect(displacedForPriority(order, "b", Number.NaN)).toBeUndefined()
  })
})
