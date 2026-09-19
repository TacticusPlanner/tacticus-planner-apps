import { describe, expect, it } from "vitest"

import {
  allocateXpBooksAcrossGoals,
  type LevelGoalNeed,
} from "./level-potential-allocation"

describe("allocateXpBooksAcrossGoals", () => {
  it("returns no entry for a goal that needs no further xp", () => {
    const result = allocateXpBooksAcrossGoals(
      [
        {
          goalId: "goal-1",
          priority: 1,
          currentLevel: 42,
          currentXp: 0,
          targetLevel: 42,
        },
      ],
      undefined
    )
    expect(result.has("goal-1")).toBe(false)
  })

  it("stays put when the owned books fall short of even the first level's need", () => {
    const result = allocateXpBooksAcrossGoals(
      [
        {
          goalId: "goal-1",
          priority: 1,
          currentLevel: 31,
          currentXp: 0,
          targetLevel: 32,
        },
      ],
      [{ xpBookId: "xpLegendary", amount: 1 }] // 12500 xp; level 32's own threshold is 94200
    )
    expect(result.get("goal-1")).toBe(31)
  })

  it("reaches a partial level when owned books partly cover the need", () => {
    const result = allocateXpBooksAcrossGoals(
      [
        {
          goalId: "goal-1",
          priority: 1,
          currentLevel: 31,
          currentXp: 0,
          targetLevel: 42,
        },
      ],
      // 20 Legendary books = 250000 xp: covers levels 32 (94200), 33 (122200), 34 (157200), and 35
      // (200200), but not 36 (252200).
      [{ xpBookId: "xpLegendary", amount: 20 }]
    )
    expect(result.get("goal-1")).toBe(35)
  })

  it("gives the higher-priority goal first claim on the shared book pool", () => {
    const goals: LevelGoalNeed[] = [
      {
        goalId: "low",
        priority: 2,
        currentLevel: 31,
        currentXp: 0,
        targetLevel: 32,
      },
      {
        goalId: "high",
        priority: 1,
        currentLevel: 31,
        currentXp: 0,
        targetLevel: 32,
      },
    ]
    // Level 32's own threshold is 94200 xp: 8 Legendary books (100000) fully cover one goal's need
    // (indivisible spending rounds up to all 8), with nothing left over for a second goal needing
    // the same amount.
    const result = allocateXpBooksAcrossGoals(goals, [
      { xpBookId: "xpLegendary", amount: 8 },
    ])
    expect(result.get("high")).toBe(32)
    expect(result.get("low")).toBe(31)
  })

  it("never double-spends a book a higher-priority goal already used", () => {
    // Both goals need level 32's own 94200 xp threshold. 9 owned Legendary books (112500) is enough
    // for the first goal (which spends all 8 whole books it takes to clear 94200 — 7 by
    // floor-division, 1 more to clear the remainder — see `consumeOwnedBooks`), leaving exactly 1
    // book (12500 xp) for the second: short of its own 94200 need. If the pool weren't actually
    // reduced after the first goal, the second would incorrectly see all 9 original books again
    // (112500 xp, enough to also reach level 32).
    const goals: LevelGoalNeed[] = [
      {
        goalId: "first",
        priority: 1,
        currentLevel: 31,
        currentXp: 0,
        targetLevel: 32,
      },
      {
        goalId: "second",
        priority: 2,
        currentLevel: 31,
        currentXp: 0,
        targetLevel: 32,
      },
    ]
    const result = allocateXpBooksAcrossGoals(goals, [
      { xpBookId: "xpLegendary", amount: 9 },
    ])
    expect(result.get("first")).toBe(32)
    expect(result.get("second")).toBe(31)
  })
})
