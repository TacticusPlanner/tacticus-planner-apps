import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"
import { buildLevelPotentialProgress } from "./level-potential-progress"

// Silver3 (rank end 11) needs level 32 in the rank-level ladder — same fixture convention as
// level-requirement-progress.test.ts.
const rankGoal = (goalId: string, entityId: string): GoalDetail =>
  ({
    goalId,
    entityId,
    entityType: "Character",
    goalType: "Rank",
    config: {
      rank: {
        start: 5,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: 11,
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
    },
  }) as unknown as GoalDetail

describe("buildLevelPotentialProgress", () => {
  it("exposes chargedXp and poolXpAvailable per goal, matching the priority-ordered allocation", () => {
    // Design's three-goal worked example: a 100,000-XP pool (8 Legendary books), three separate
    // units each needing 12,200 XP (level 31 -> 32), processed in priority order.
    const orderedDetails = [
      rankGoal("p1", "one"),
      rankGoal("p2", "two"),
      rankGoal("p3", "three"),
    ]
    const priorityByGoalId = new Map([
      ["p1", 1],
      ["p2", 2],
      ["p3", 3],
    ])
    const playerCharacterById = new Map([
      ["one", { xpLevel: 31, xp: 82000 }],
      ["two", { xpLevel: 31, xp: 82000 }],
      ["three", { xpLevel: 31, xp: 82000 }],
    ])

    const result = buildLevelPotentialProgress({
      orderedDetails,
      priorityByGoalId,
      playerCharacterById,
      inventoryXpBooks: [{ xpBookId: "xpLegendary", amount: 8 }],
    })

    expect(result.chargedXpByGoalId.get("p1")).toBe(12200)
    expect(result.poolXpAvailableByGoalId.get("p1")).toBe(100000)
    expect(result.poolXpAvailableByGoalId.get("p2")).toBe(87500)
    expect(result.ratioByGoalId.get("p1")).toBe(1)
  })

  it("reads 0% potential for a near-target character with no owned books, not an absolute-level artifact", () => {
    // 1 XP short of level 32 (94,200 threshold) reads ~97% on an absolute 1..32 scale, but with no
    // owned books at all, books give this goal zero benefit — the bug show-xp-book-availability-per-
    // goal's available/needed count exposed (a near-max-level character showed a misleadingly high
    // Potential % purely from being close to the target already, unrelated to book availability).
    const result = buildLevelPotentialProgress({
      orderedDetails: [rankGoal("near", "solo")],
      priorityByGoalId: new Map([["near", 1]]),
      playerCharacterById: new Map([["solo", { xpLevel: 31, xp: 94199 }]]),
      inventoryXpBooks: undefined,
    })

    expect(result.ratioByGoalId.get("near")).toBe(0)
  })

  it("gives no entries for a goal already at its required level", () => {
    const result = buildLevelPotentialProgress({
      orderedDetails: [rankGoal("done", "one")],
      priorityByGoalId: new Map([["done", 1]]),
      playerCharacterById: new Map([["one", { xpLevel: 42, xp: 400000 }]]),
      inventoryXpBooks: undefined,
    })

    expect(result.chargedXpByGoalId.has("done")).toBe(false)
    expect(result.poolXpAvailableByGoalId.has("done")).toBe(false)
    expect(result.ratioByGoalId.has("done")).toBe(false)
  })
})
