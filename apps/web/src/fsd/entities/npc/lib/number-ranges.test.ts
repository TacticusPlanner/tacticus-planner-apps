import { describe, expect, it } from "vitest"

import { collapseRanges } from "./number-ranges"

describe("collapseRanges", () => {
  it("collapses consecutive numbers", () => {
    expect(collapseRanges([3, 7, 12, 13, 14])).toEqual([
      [3, 3],
      [7, 7],
      [12, 14],
    ])
  })

  it("ignores order and duplicates", () => {
    expect(collapseRanges([14, 12, 13, 12])).toEqual([[12, 14]])
  })

  it("handles an empty list and a single number", () => {
    expect(collapseRanges([])).toEqual([])
    expect(collapseRanges([5])).toEqual([[5, 5]])
  })
})
