import { describe, expect, it } from "vitest"

import {
  allocateOrbInventory,
  createOrbGoalNeed,
} from ".//orb-potential-allocation"

describe("orb potential allocation", () => {
  it("lets the higher-priority goal claim shared alliance orbs first", () => {
    const later = createOrbGoalNeed({
      goalId: "later",
      priority: 2,
      alliance: "Xenos",
      orbsByType: { Rare: 10 },
    })!
    const first = createOrbGoalNeed({
      goalId: "first",
      priority: 1,
      alliance: "Xenos",
      orbsByType: { Rare: 10 },
    })!

    const allocations = allocateOrbInventory([later, first], {
      imperial: [],
      xenos: [{ rarity: "Rare", amount: 10 }],
      chaos: [],
    })

    expect(allocations.get("first")?.stages[0]?.remaining).toEqual([])
    expect(allocations.get("later")?.stages[0]?.remaining).toEqual([
      { id: "orb:xenos:Rare", count: 10 },
    ])
  })
})
