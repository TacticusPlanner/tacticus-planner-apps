import { describe, expect, it } from "vitest"

import { sumPools } from "./goal-resource-totals"

describe("sumPools", () => {
  it("caps each rarity's available at what it needs before summing", () => {
    expect(
      sumPools([
        { pool: { available: 900, needed: 10 } },
        { pool: { available: 3, needed: 50 } },
      ])
    ).toEqual({ available: 13, needed: 60 })
  })

  it("skips parts without a pool", () => {
    expect(sumPools([{}, { pool: { available: 1, needed: 2 } }])).toEqual({
      available: 1,
      needed: 2,
    })
  })
})
