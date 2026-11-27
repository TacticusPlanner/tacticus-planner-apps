import { describe, expect, it } from "vitest"

import { sumRanges } from "./sum-ranges"

describe("sumRanges", () => {
  it("adds up ranges by key in first-seen order", () => {
    const rewards = [
      { id: "gold", min: 10, max: 20 },
      { id: "shards", min: 1, max: 1 },
      { id: "gold", min: 5, max: 5 },
    ]
    expect(sumRanges(rewards, (reward) => reward.id)).toEqual([
      { id: "gold", min: 15, max: 25 },
      { id: "shards", min: 1, max: 1 },
    ])
  })

  it("keeps the first item's other fields and leaves the inputs alone", () => {
    const first = { type: "gold", min: 1, max: 2, note: "first" }
    const result = sumRanges(
      [first, { type: "gold", min: 3, max: 4, note: "second" }],
      (reward) => reward.type
    )
    expect(result).toEqual([{ type: "gold", min: 4, max: 6, note: "first" }])
    expect(first).toEqual({ type: "gold", min: 1, max: 2, note: "first" })
  })

  it("returns nothing for no items", () => {
    expect(sumRanges([], () => "")).toEqual([])
  })
})
