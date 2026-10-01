import { describe, expect, it } from "vitest"

import { tierAfterSectorChange } from "./tier-after-sector-change"

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
