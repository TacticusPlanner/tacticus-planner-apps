import { describe, expect, it } from "vitest"

import { rangeOfIds } from "./use-goals-selection"

describe("rangeOfIds", () => {
  const ids = ["a", "b", "c", "d", "e"]

  it("covers the anchor through the target in visible order, either direction", () => {
    expect(rangeOfIds(ids, "b", "d")).toEqual(["b", "c", "d"])
    expect(rangeOfIds(ids, "d", "b")).toEqual(["b", "c", "d"])
  })

  it("is just the target without a visible anchor", () => {
    expect(rangeOfIds(ids, null, "c")).toEqual(["c"])
    expect(rangeOfIds(ids, "gone", "c")).toEqual(["c"])
  })
})
