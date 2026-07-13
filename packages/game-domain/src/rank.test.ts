import { describe, expect, it } from "vitest"

import { isAdamantineRank, isRank, lastRank, rankOrder } from "./rank"

describe("isAdamantineRank", () => {
  it("recognizes current Adamantine ranks", () => {
    expect(isAdamantineRank("Adamantine1")).toBe(true)
    expect(isAdamantineRank("Adamantine2")).toBe(true)
    expect(isAdamantineRank("Stone1")).toBe(false)
  })
})

describe("lastRank", () => {
  it("excludes the unreleased Adamantine3 rank", () => {
    expect(lastRank).toBe("Adamantine2")
    expect(rankOrder).not.toContain("Adamantine3")
    expect(isRank("Adamantine3")).toBe(false)
  })
})
