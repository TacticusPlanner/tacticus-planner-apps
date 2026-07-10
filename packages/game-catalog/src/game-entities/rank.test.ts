import { describe, expect, it } from "vitest"

import { isAdamantineRank, isRank, lastRank, rankOrder } from "./rank"

describe("isAdamantineRank", () => {
  it("is true for both current Adamantine ranks", () => {
    expect(isAdamantineRank("Adamantine1")).toBe(true)
    expect(isAdamantineRank("Adamantine2")).toBe(true)
  })

  it("is false for non-Adamantine ranks", () => {
    expect(isAdamantineRank("Stone1")).toBe(false)
    expect(isAdamantineRank("Diamond3")).toBe(false)
  })
})

describe("lastRank", () => {
  it("is Adamantine2 — Adamantine3 is planned but not yet in the ladder at all", () => {
    expect(lastRank).toBe("Adamantine2")
    expect(rankOrder).not.toContain("Adamantine3")
    expect(isRank("Adamantine3")).toBe(false)
  })
})
