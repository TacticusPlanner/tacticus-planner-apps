import { describe, expect, it } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { orderCombinedEntries } from "./combined-raids-order"

const entry = (goalId: string, resourceId: string, battle: string) => ({
  goalId,
  resourceId: resourceId as string as never,
  battleId: battleIdSchema.parse(battle),
  raidsPerformed: 1,
  itemsFarmed: 1,
  energySpent: 6,
  dailyAttempts: 10,
  remainingBefore: 1,
})

describe("orderCombinedEntries", () => {
  it("orders by pooled energy, then days, keeping a resource's entries together and unknowns last", () => {
    const entries = [
      entry("g1", "cheap", "B1"),
      entry("g1", "unknown", "B2"),
      entry("g2", "costly", "B3"),
      entry("g1", "cheap", "B4"),
      entry("g3", "slow", "B5"),
      entry("g2", "costly", "B6"),
    ]
    const ordered = orderCombinedEntries(
      entries,
      new Map([
        ["cheap", { days: 9, energyTotal: 100 }],
        ["costly", { days: 3, energyTotal: 900 }],
        ["slow", { days: 12, energyTotal: 100 }],
      ])
    )
    expect(ordered.map((e) => `${String(e.resourceId)}@${e.battleId}`)).toEqual(
      [
        "costly@B3",
        "costly@B6",
        "slow@B5",
        "cheap@B1",
        "cheap@B4",
        "unknown@B2",
      ]
    )
  })
})
