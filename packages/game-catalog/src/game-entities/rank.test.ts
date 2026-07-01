import { describe, expect, it } from "vitest"

import { isAdamantineRank } from "./rank"

describe("isAdamantineRank", () => {
  it("is true for all three Adamantine ranks", () => {
    expect(isAdamantineRank("Adamantine1")).toBe(true)
    expect(isAdamantineRank("Adamantine2")).toBe(true)
    expect(isAdamantineRank("Adamantine3")).toBe(true)
  })

  it("is false for non-Adamantine ranks", () => {
    expect(isAdamantineRank("Stone1")).toBe(false)
    expect(isAdamantineRank("Diamond3")).toBe(false)
  })
})
