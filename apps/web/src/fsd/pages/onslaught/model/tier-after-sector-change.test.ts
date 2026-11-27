import { describe, expect, it } from "vitest"

import {
  farmableTiers,
  selectedTier,
  tierAfterCompleteToggle,
  tierAfterSectorChange,
} from "./tier-after-sector-change"

describe("tierAfterSectorChange", () => {
  it.each([
    ["Gold", "Diamond", 4, 1],
    ["Diamond", "Gold", 1, 4],
    ["Silver", "Silver", 2, 2],
    ["Gold", "Stone", 4, 4],
  ] as const)("%s -> %s at tier %i gives %i", (from, to, tier, expected) => {
    expect(tierAfterSectorChange(from, to, tier)).toBe(expected)
  })
})

describe("sector complete checkbox", () => {
  it("shows a completed sector as tier 3 in the Tier select", () => {
    expect(selectedTier(4)).toBe(3)
    expect(selectedTier(2)).toBe(2)
  })

  it("stores tier 4 when checked and returns to tier 3 when unchecked", () => {
    expect(tierAfterCompleteToggle(true)).toBe(4)
    expect(tierAfterCompleteToggle(false)).toBe(3)
  })

  it("offers only the farmable tiers 1-3", () => {
    expect(farmableTiers).toEqual([1, 2, 3])
  })
})
