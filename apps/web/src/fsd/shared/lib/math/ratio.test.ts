import { describe, expect, it } from "vitest"

import { clamp01, clampRatio } from "./ratio"

describe("clamp01", () => {
  it("holds a value to 0–1", () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(0.25)).toBe(0.25)
    expect(clamp01(3)).toBe(1)
  })
})

describe("clampRatio", () => {
  it("is done over total, held to 0–1", () => {
    expect(clampRatio(1, 4)).toBe(0.25)
    expect(clampRatio(6, 4)).toBe(1)
    expect(clampRatio(-1, 4)).toBe(0)
  })

  it("counts nothing to do as complete", () => {
    expect(clampRatio(0, 0)).toBe(1)
    expect(clampRatio(3, -2)).toBe(1)
  })
})
