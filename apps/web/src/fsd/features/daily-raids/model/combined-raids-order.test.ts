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
  it("orders by pooled days, then energy, keeping a resource's entries together and unknowns last", () => {
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
        "slow@B5",
        "cheap@B1",
        "cheap@B4",
        "costly@B3",
        "costly@B6",
        "unknown@B2",
      ]
    )
  })

  it("pulls same-campaign resources within 50 energy together", () => {
    const location = (id: string, campaignKey: string) => ({
      id,
      campaignKey,
      campaignName: id,
      nodeLabel: "",
      shortLabel: id,
      challenge: false,
    })
    const ordered = orderCombinedEntries(
      [entry("g1", "A", "I1"), entry("g2", "B", "C1"), entry("g3", "C", "I2")],
      new Map([
        ["A", { days: 5, energyTotal: 120 }],
        ["B", { days: 5, energyTotal: 110 }],
        ["C", { days: 5, energyTotal: 80 }],
      ]),
      new Map([
        [battleIdSchema.parse("I1"), location("I1", "indomitus:Elite")],
        [battleIdSchema.parse("I2"), location("I2", "indomitus:Elite")],
        [battleIdSchema.parse("C1"), location("C1", "cadia:Elite")],
      ])
    )
    expect(ordered.map((e) => String(e.resourceId))).toEqual(["A", "C", "B"])
  })
})
