import { describe, expect, it } from "vitest"

import { allocateLevelXp, type LevelXpNeed } from "./level-xp-allocation"

const bellator = (
  goalId: string,
  priority: number,
  requiredLevel: number,
  overrides: Partial<LevelXpNeed> = {}
): LevelXpNeed => ({
  goalId,
  unitKey: "Character:bellator",
  priority,
  currentLevel: 31,
  currentXp: 82000,
  requiredLevel,
  ...overrides,
})

describe("allocateLevelXp", () => {
  it("returns no entry for a goal already at its required level", () => {
    const result = allocateLevelXp(
      [bellator("done", 1, 31, { currentLevel: 42, currentXp: 400000 })],
      undefined
    )
    expect(result.has("done")).toBe(false)
  })

  it("charges the raw gap and covers it with one whole book (worked Bellator example)", () => {
    // Level 32's threshold is 94,200 XP; Bellator has 82,000 → 12,200 XP. One 12,500-XP Legendary book
    // covers it whole, so Potential reaches 32 while the raw gap stays 12,200.
    const result = allocateLevelXp(
      [bellator("silver3", 1, 32)],
      [{ xpBookId: "xpLegendary", amount: 1 }]
    )
    expect(result.get("silver3")).toEqual({
      chargedXp: 12200,
      potentialLevel: 32,
    })
  })

  it("stays at the current level when books fall short of the first level", () => {
    const result = allocateLevelXp(
      [bellator("silver3", 1, 32, { currentXp: 0 })],
      [{ xpBookId: "xpLegendary", amount: 1 }] // 12,500 of the 94,200 needed
    )
    expect(result.get("silver3")?.potentialLevel).toBe(31)
  })

  it("reaches a partial level when owned books partly cover the need", () => {
    // 20 Legendary books = 250,000 XP covers levels 32 through 35 (200,200) but not 36 (252,200).
    const result = allocateLevelXp(
      [bellator("far", 1, 42, { currentXp: 0 })],
      [{ xpBookId: "xpLegendary", amount: 20 }]
    )
    expect(result.get("far")?.potentialLevel).toBe(35)
  })

  it("gives the higher-priority goal first claim on the shared book pool", () => {
    const result = allocateLevelXp(
      [
        bellator("low", 2, 32, { unitKey: "Character:other", currentXp: 0 }),
        bellator("high", 1, 32, { currentXp: 0 }),
      ],
      [{ xpBookId: "xpLegendary", amount: 8 }] // 100,000 XP: one goal's 94,200, none left for the other
    )
    expect(result.get("high")?.potentialLevel).toBe(32)
    expect(result.get("low")?.potentialLevel).toBe(31)
  })

  it("charges overlapping Rank milestones of one unit the shared interval once", () => {
    // Milestone A needs level 32 (12,200 XP), milestone B needs level 33 (40,200 XP from the same
    // 82,000): B is charged only the 28,000 XP beyond A's interval.
    const result = allocateLevelXp(
      [bellator("b", 2, 33), bellator("a", 1, 32)],
      [{ xpBookId: "xpLegendary", amount: 4 }]
    )
    expect(result.get("a")?.chargedXp).toBe(12200)
    expect(result.get("b")?.chargedXp).toBe(28000)
    expect(result.get("b")?.potentialLevel).toBe(33)
  })

  it("does not double-spend books across overlapping milestones", () => {
    const other = bellator("other", 3, 32, {
      unitKey: "Character:other",
    })
    // A takes 1 Legendary, B 3 (2 by floor division + 1 to clear the remainder): 4 books in total, so
    // a third goal on another unit finds the pool empty. Counting B's full 40,200 XP would need all 4
    // books for B alone.
    const four = allocateLevelXp(
      [bellator("a", 1, 32), bellator("b", 2, 33), other],
      [{ xpBookId: "xpLegendary", amount: 4 }]
    )
    expect(four.get("other")?.potentialLevel).toBe(31)
    const five = allocateLevelXp(
      [bellator("a", 1, 32), bellator("b", 2, 33), other],
      [{ xpBookId: "xpLegendary", amount: 5 }]
    )
    expect(five.get("other")?.potentialLevel).toBe(32)
  })

  it("charges a lower-priority goal nothing when a higher-priority goal already covers it", () => {
    const result = allocateLevelXp(
      [bellator("high", 1, 33), bellator("low", 2, 32)],
      [{ xpBookId: "xpLegendary", amount: 4 }]
    )
    expect(result.get("low")).toEqual({ chargedXp: 0, potentialLevel: 32 })
  })
})
