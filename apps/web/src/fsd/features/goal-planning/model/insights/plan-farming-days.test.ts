import { describe, expect, it } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { farmingDays, spreadRuns } from "./plan-farming-days"
import type { RunsByBattle } from "./plan-farming-days"

const battleId = battleIdSchema.parse
const node = (id: string, dailyAttempts: number, energyCost = 10) => ({
  battleId: battleId(id),
  energyCost,
  dropRate: 0.5,
  dailyAttempts,
})

describe("spreadRuns", () => {
  it("splits the raids across capped nodes so they finish together", () => {
    const spread = spreadRuns(30, [node("A", 6), node("B", 6)])

    expect(spread.map(({ node, runs }) => [node.battleId, runs])).toEqual([
      ["A", 30],
      ["B", 30],
    ])
    const runsByBattle: RunsByBattle = new Map(
      spread.map(({ node, runs }) => [
        node.battleId,
        { runs, dailyAttempts: node.dailyAttempts },
      ])
    )
    // 60 raids at 12 a day across both nodes: 5 days, not the 10 one node alone would take.
    expect(farmingDays(600, runsByBattle, 10_000)).toBe(5)
  })

  it("weights the split by each node's items per day", () => {
    const spread = spreadRuns(30, [node("A", 3), node("B", 9)])

    expect(spread.map(({ runs }) => runs)).toEqual([15, 45])
  })

  it("puts every raid on the cheapest uncapped node", () => {
    const spread = spreadRuns(3, [node("A", 6), node("B", 0, 12), node("C", 0)])

    expect(spread.map(({ node, runs }) => [node.battleId, runs])).toEqual([
      ["C", 6],
    ])
  })

  it("returns nothing when no node drops the item", () => {
    expect(spreadRuns(3, [{ ...node("A", 6), dropRate: 0 }])).toEqual([])
  })
})
