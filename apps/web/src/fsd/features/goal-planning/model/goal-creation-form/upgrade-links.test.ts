import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { defaultUpgradeLinks } from "./upgrade-links"

const rankGoal = (
  goalId: string,
  start: number,
  end: number,
  pointFive = false
) =>
  ({
    goalId,
    config: {
      rank: {
        start,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end,
        endPointFive: pointFive,
        endAppliedUpgrades: 0,
      },
      ability: null,
    },
  }) as GoalDetail

describe("defaultUpgradeLinks", () => {
  const goals = [rankGoal("to-g2", 8, 11), rankGoal("to-d1", 11, 13)]

  it("links the Rank goals whose span overlaps the range", () => {
    expect(
      defaultUpgradeLinks(goals, { rankRange: { start: 11, end: 13 } })
    ).toEqual(["to-d1"])
  })

  it("reaches one rank further for a .5 target", () => {
    expect(
      defaultUpgradeLinks([rankGoal("to-g2.5", 8, 11, true)], {
        rankRange: { start: 11, end: 13 },
      })
    ).toEqual(["to-g2.5"])
  })

  it("links nothing without a range", () => {
    expect(defaultUpgradeLinks(goals, {})).toEqual([])
  })
})
