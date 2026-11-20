import { describe, expect, it } from "vitest"

import { compareCodeUnits } from "./compare-code-units"

describe("compareCodeUnits", () => {
  it("matches the default Array#sort order", () => {
    const words = ["beta", "Alpha", "alpha", "Beta", "10", "9", "é", "e"]
    // eslint-disable-next-line unicorn/require-array-sort-compare -- the default order is what is under test
    expect(words.toSorted(compareCodeUnits)).toEqual(words.toSorted())
  })

  it("returns 0 for equal strings", () => {
    expect(compareCodeUnits("a", "a")).toBe(0)
  })
})
