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
      poolXpAvailable: 12500,
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
    expect(result.get("low")).toEqual({
      chargedXp: 0,
      potentialLevel: 32,
      // "high" charges 40,200 XP and spends all 4 Legendary books (50,000 XP: 3 by floor division
      // plus 1 more whole book to cover the 2,700 remainder), leaving nothing for "low".
      poolXpAvailable: 0,
    })
  })

  describe("poolXpAvailable", () => {
    // Design's three-goal worked example: a 100,000-XP pool (8 Legendary books), three separate
    // units each needing 12,200 XP, processed in priority order 1, 2, 3.
    const pool = [{ xpBookId: "xpLegendary", amount: 8 }]
    const needs: LevelXpNeed[] = [
      bellator("p1", 1, 32, { unitKey: "Character:one", currentXp: 82000 }),
      bellator("p2", 2, 32, { unitKey: "Character:two", currentXp: 82000 }),
      bellator("p3", 3, 32, { unitKey: "Character:three", currentXp: 82000 }),
    ]

    it("reports the full pool for the first goal in priority order", () => {
      const result = allocateLevelXp(needs, pool)
      expect(result.get("p1")?.poolXpAvailable).toBe(100000)
    })

    it("reports the pool net of an earlier goal's spend for the next goal", () => {
      const result = allocateLevelXp(needs, pool)
      // p1 charges 12,200 and spends one 12,500 Legendary book (rounds up to a whole book).
      expect(result.get("p2")?.poolXpAvailable).toBe(87500)
    })

    it("reports zero once the pool is fully depleted by higher-priority goals", () => {
      const depleting: LevelXpNeed[] = [
        bellator("only", 1, 32, {
          unitKey: "Character:solo",
          currentXp: 82000,
        }),
      ]
      const result = allocateLevelXp(depleting, [
        { xpBookId: "xpLegendary", amount: 1 },
      ])
      expect(result.get("only")?.poolXpAvailable).toBe(12500)

      const exhausted = allocateLevelXp(
        [
          bellator("first", 1, 32, {
            unitKey: "Character:a",
            currentXp: 82000,
          }),
          bellator("second", 2, 32, {
            unitKey: "Character:b",
            currentXp: 82000,
          }),
        ],
        [{ xpBookId: "xpLegendary", amount: 1 }]
      )
      expect(exhausted.get("second")?.poolXpAvailable).toBe(0)
    })

    it("reports a pool that only partially covers a goal's own charged XP", () => {
      // "big" needs level 33 (40,200 XP) but only 1 Legendary book (12,500 XP) is left by its turn.
      const result = allocateLevelXp(
        [
          bellator("first", 1, 32, {
            unitKey: "Character:a",
            currentXp: 82000,
          }),
          bellator("big", 2, 33, { unitKey: "Character:b", currentXp: 82000 }),
        ],
        [{ xpBookId: "xpLegendary", amount: 2 }]
      )
      expect(result.get("big")?.chargedXp).toBe(40200)
      expect(result.get("big")?.poolXpAvailable).toBe(12500)
    })
  })
})
