import { describe, expect, it } from "vitest"

import { tierToneClass } from "./tier-tone"

const UNTIERED = "border-border bg-muted"

describe("tierToneClass", () => {
  it("gives each tier its own tone, D included, none of them the untiered one", () => {
    const tones = ["S", "A", "B", "C", "D"].map((tier) => tierToneClass(tier))
    expect(new Set(tones).size).toBe(5)
    expect(tones).not.toContain(UNTIERED)
    expect(tierToneClass("D")).toBe(
      "border-dashed border-muted-foreground/60 bg-muted"
    )
  })

  it("uses the untiered tone for no tier or an unknown one", () => {
    expect(tierToneClass(null)).toBe(UNTIERED)
    expect(tierToneClass("Z")).toBe(UNTIERED)
  })
})
