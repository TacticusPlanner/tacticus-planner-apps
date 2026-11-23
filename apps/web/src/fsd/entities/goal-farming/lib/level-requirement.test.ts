import { describe, expect, it } from "vitest"
import { Rank, rankIndex } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal/@x/goal-farming"
import { levelRules } from "@/test/fixtures/level-rules"

import { requiredLevelForGoal } from "./level-requirement"

const rankGoal = (
  end: Rank,
  endAppliedUpgrades: number,
  endPointFive = false
): Pick<GoalDetail, "goalType" | "entityType" | "config"> =>
  ({
    goalType: "Rank",
    entityType: "Character",
    config: {
      rank: {
        start: 0,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: rankIndex(end),
        endPointFive,
        endAppliedUpgrades,
      },
    },
  }) as Pick<GoalDetail, "goalType" | "entityType" | "config">

describe("requiredLevelForGoal", () => {
  it("needs one more level for each Diamond2 bottom-row slot a Rank goal stops at", () => {
    expect(requiredLevelForGoal(rankGoal(Rank.Diamond2, 0), levelRules)).toBe(
      47
    )
    expect(requiredLevelForGoal(rankGoal(Rank.Diamond2, 3), levelRules)).toBe(
      47
    )
    expect(requiredLevelForGoal(rankGoal(Rank.Diamond2, 4), levelRules)).toBe(
      48
    )
    expect(requiredLevelForGoal(rankGoal(Rank.Diamond2, 5), levelRules)).toBe(
      49
    )
  })

  it("reads a saved point-five goal below Diamond3 as the top row", () => {
    expect(
      requiredLevelForGoal(rankGoal(Rank.Diamond2, 0, true), levelRules)
    ).toBe(47)
  })

  it("is null for a MoW, a goal kind without a level, and a Rank goal without a target", () => {
    expect(
      requiredLevelForGoal(
        { ...rankGoal(Rank.Diamond2, 4), entityType: "Mow" },
        levelRules
      )
    ).toBeNull()
    expect(
      requiredLevelForGoal(
        { ...rankGoal(Rank.Diamond2, 4), goalType: "Ascension" },
        levelRules
      )
    ).toBeNull()
    expect(
      requiredLevelForGoal(
        { ...rankGoal(Rank.Diamond2, 4), config: {} } as never,
        levelRules
      )
    ).toBeNull()
  })
})
