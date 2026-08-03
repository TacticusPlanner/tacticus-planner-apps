import { describe, expect, it } from "vitest"

import {
  computeLevelGoalCost,
  netXpAgainstOwnedBooks,
  ownedBooksByRarity,
  xpNeededForLevelRange,
} from ".//level-xp-cost"

describe("xpNeededForLevelRange", () => {
  it("computes the cumulative-xp gap between two levels, net of partial xp already earned", () => {
    // totalXp at level 30 = 72200, at level 41 = 809200 (ported xp.json thresholds).
    expect(xpNeededForLevelRange(31, 0, 42)).toBe(737000)
    expect(xpNeededForLevelRange(31, 50000, 42)).toBe(687000)
  })

  it("is 0 for an already-reached or inverted range", () => {
    expect(xpNeededForLevelRange(42, 0, 42)).toBe(0)
    expect(xpNeededForLevelRange(42, 0, 31)).toBe(0)
  })

  it("is 0 when partial xp alone already covers the gap", () => {
    expect(xpNeededForLevelRange(31, 999_999_999, 32)).toBe(0)
  })
})

describe("netXpAgainstOwnedBooks", () => {
  it("spends highest-value books first, most XP-efficiently", () => {
    // 22000 xp needed, owns 2 Legendary (12500 each) — 1 covers most, second covers the rest.
    expect(netXpAgainstOwnedBooks(22_000, { Legendary: 2 })).toBe(0)
  })

  it("spends a whole extra book to finish off a remainder the floor-division pass couldn't cover", () => {
    // 25 xp needed, 2 Common (20 xp) books owned: the first pass floor-divides to 1 book (used,
    // remainder 5), the second pass then spends a second whole book to clear that remainder.
    expect(netXpAgainstOwnedBooks(25, { Common: 2 })).toBe(0)
  })

  it("leaves a positive remainder once owned books run out", () => {
    expect(netXpAgainstOwnedBooks(50_000, { Legendary: 1 })).toBe(37_500)
  })

  it("doesn't mutate the input map", () => {
    const owned = { Legendary: 2 }
    netXpAgainstOwnedBooks(12_500, owned)
    expect(owned).toEqual({ Legendary: 2 })
  })
})

describe("ownedBooksByRarity", () => {
  it("collapses a raw xpBooks inventory into owned-by-rarity via the guessed id map", () => {
    expect(
      ownedBooksByRarity([
        { xpBookId: "bookLegendary", amount: 3 },
        { xpBookId: "bookCommon", amount: 10 },
      ])
    ).toEqual({ Legendary: 3, Common: 10 })
  })

  it("skips unrecognized ids rather than miscounting", () => {
    expect(
      ownedBooksByRarity([{ xpBookId: "not-a-real-id", amount: 5 }])
    ).toEqual({})
  })

  it("is empty for undefined/empty inventory", () => {
    expect(ownedBooksByRarity(undefined)).toEqual({})
    expect(ownedBooksByRarity([])).toEqual({})
  })
})

describe("computeLevelGoalCost", () => {
  it("expresses the netted remainder as a Legendary-equivalent book count plus gold to apply", () => {
    const cost = computeLevelGoalCost({
      currentLevel: 31,
      currentXp: 0,
      targetLevel: 42,
      ownedXpBooks: undefined,
    })
    expect(cost).toEqual({ books: 59, gold: 29_500 })
  })

  it("nets against owned books before converting to a book count", () => {
    const cost = computeLevelGoalCost({
      currentLevel: 31,
      currentXp: 0,
      targetLevel: 32,
      ownedXpBooks: [{ xpBookId: "bookLegendary", amount: 2 }],
    })
    expect(cost).toBeNull()
  })

  it("is null once nothing further is needed", () => {
    expect(
      computeLevelGoalCost({
        currentLevel: 42,
        currentXp: 0,
        targetLevel: 42,
        ownedXpBooks: undefined,
      })
    ).toBeNull()
  })
})
