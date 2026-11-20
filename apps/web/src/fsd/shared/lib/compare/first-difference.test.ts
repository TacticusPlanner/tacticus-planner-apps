import { describe, expect, it } from "vitest"

import { firstDifference } from "./first-difference"

describe("firstDifference", () => {
  it("returns the first result that is not 0", () => {
    expect(firstDifference(0, -3, 5)).toBe(-3)
  })

  it("skips NaN like `||` does", () => {
    expect(firstDifference(Number.NaN, 2)).toBe(2)
  })

  it("returns 0 when nothing orders the pair", () => {
    expect(firstDifference(0, Number.NaN)).toBe(0)
    expect(firstDifference()).toBe(0)
  })
})
