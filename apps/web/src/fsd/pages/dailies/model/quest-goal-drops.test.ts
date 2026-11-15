import { describe, expect, it } from "vitest"

import type { DailyRaidsViewModel } from "@/features/daily-raids"

import { questGoalDrops } from "./quest-goal-drops"

const raids = {
  status: "ready",
  resourceTotals: new Map([
    ["powerPack", { owned: 14, target: 24 }],
    ["done", { owned: 9, target: 5 }],
  ]),
  goalsById: new Map([
    ["g2", { goalId: "g2", priority: 2, unitLabel: "Dante" }],
    ["g1", { goalId: "g1", priority: 1, unitLabel: "Maladus" }],
  ]),
  resourceUrgencyByGoalAndResource: new Map([
    ["g1:powerPack", 1],
    ["g2:powerPack", 1],
  ]),
} as unknown as DailyRaidsViewModel

const battle = (
  number: number,
  upgradeId: string,
  chanceNumerator: number,
  chanceDenominator: number
) => ({
  number,
  loot: { upgradeId, chanceNumerator, chanceDenominator },
})

describe("questGoalDrops", () => {
  it("lists only needed drops, each with its battles by best odds", () => {
    const result = questGoalDrops(raids, [
      battle(5, "powerPack", 1, 2),
      battle(1, "powerPack", 3, 4),
      battle(2, "done", 1, 1),
      battle(3, "unneeded", 1, 1),
      battle(9, "powerPack", 3, 4),
    ])

    expect(result).toEqual({
      status: "ready",
      drops: [
        {
          upgradeId: "powerPack",
          have: 14,
          need: 24,
          units: ["Maladus", "Dante"],
          battles: [
            { number: 1, numerator: 3, denominator: 4 },
            { number: 9, numerator: 3, denominator: 4 },
            { number: 5, numerator: 1, denominator: 2 },
          ],
        },
      ],
    })
  })

  it("is hidden until the goal plan is ready", () => {
    expect(
      questGoalDrops({ status: "no-goals" } as DailyRaidsViewModel, [])
    ).toEqual({ status: "hidden" })
  })
})
