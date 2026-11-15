import { describe, expect, it } from "vitest"

import { tierLabels } from "./tier-labels"

describe("tierLabels", () => {
  it("numbers tiers within their rarity", () => {
    const labels = tierLabels([
      { index: 0, rarity: "Common" },
      { index: 1, rarity: "Common" },
      { index: 2, rarity: "Mythic" },
    ])
    expect([...labels.values()]).toEqual([
      { rarity: "Common", number: 1 },
      { rarity: "Common", number: 2 },
      { rarity: "Mythic", number: 1 },
    ])
  })
})
