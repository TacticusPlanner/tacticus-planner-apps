import { describe, expect, it } from "vitest"

import { currentMaxRank, isAdamantineRank, lastRank } from "./rank"

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

describe("currentMaxRank", () => {
  it("is Adamantine2, one below the ladder's absolute max (Adamantine3 isn't fully available yet)", () => {
    expect(currentMaxRank).toBe("Adamantine2")
    expect(lastRank).toBe("Adamantine3")
    expect(currentMaxRank).not.toBe(lastRank)
  })
})
