import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { computeGoalProgress } from "./goal-progress"

function rankDetail(start: number, end: number, endAppliedUpgrades = 0) {
  return {
    entityType: "Character",
    goalType: "Rank",
    config: {
      rank: {
        start,
        end,
        startPointFive: false,
        startAppliedUpgrades: 0,
        endPointFive: false,
        endAppliedUpgrades,
      },
    },
  } as GoalDetail
}

describe("computeGoalProgress Rank", () => {
  it("measures a same-rank partial target by applied slots", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(1, 1, 2),
        playerCharacter: {
          rank: "Stone2",
          appliedUpgradeSlots: [0],
        },
      } as never)
    ).toMatchObject({ kind: "Rank", ratio: 0.5 })
  })

  it("includes applied slots between full rank boundaries", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(0, 2),
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [0, 2, 4],
        },
      } as never)
    ).toMatchObject({ kind: "Rank", ratio: 0.25 })
  })

  it("does not complete an ahead-of-player clean rank target with a zero configured span", () => {
    expect(
      computeGoalProgress({
        detail: rankDetail(2, 2),
        playerCharacter: { rank: "Stone1", appliedUpgradeSlots: [] },
      } as never)
    ).toMatchObject({ kind: "Rank", ratio: 0 })
  })
})
