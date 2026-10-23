import { describe, expect, it } from "vitest"

import { spliceGoalOrder } from "./goal-order"

describe("spliceGoalOrder", () => {
  it("anchors before the goal now following it in the visible list", () => {
    const full = ["a", "b", "c", "d"]
    // b dragged to sit immediately before d — visible order becomes [a, c, b, d].
    const result = spliceGoalOrder(full, ["a", "c", "b", "d"], "b")
    expect(result).toEqual(["a", "c", "b", "d"])
  })

  it("anchors after the goal now preceding it when dropped last", () => {
    const full = ["a", "b", "c", "d"]
    // a dragged to the very end — visible order becomes [b, c, d, a].
    const result = spliceGoalOrder(full, ["b", "c", "d", "a"], "a")
    expect(result).toEqual(["b", "c", "d", "a"])
  })

  it("interleaves across a different unit's goal, unlike a unit-grained model", () => {
    // a and c share a unit; b belongs to a different one, sitting between them after the drag.
    const full = ["a", "c", "b"]
    const result = spliceGoalOrder(full, ["a", "b", "c"], "b")
    expect(result).toEqual(["a", "b", "c"])
  })

  it("works within a filtered/grouped subset that is not the full priority order", () => {
    const full = ["a", "b", "c", "d", "e"]
    // Visible subset only shows b and d (e.g. one Group=unit cluster); dragging d before b.
    const result = spliceGoalOrder(full, ["d", "b"], "d")
    expect(result).toEqual(["a", "d", "b", "c", "e"])
  })
})
