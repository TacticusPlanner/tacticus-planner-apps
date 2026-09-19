import { describe, expect, it } from "vitest"

import {
  computeLevelGoalCost,
  consumeOwnedBooks,
  maxLevelReachableWithXp,
  netXpAgainstOwnedBooks,
  ownedBooksByRarity,
  xpNeededForLevelRange,
} from "./level-xp-cost"

describe("xpNeededForLevelRange", () => {
  it("computes the gap to the target level's own total-xp threshold, net of total xp already gained", () => {
    // totalXp at level 42 (index 41 in the ported xp.json thresholds) = 809200. `currentXp` is the
    // character's *total* xp gained (matches the real Tacticus API's own `xp` field — "total XP
    // gained for character" — not a per-level-reset partial amount), so it subtracts directly
    // against the target level's own cumulative threshold, with no separate "current level's
    // threshold" term.
    expect(xpNeededForLevelRange(31, 0, 42)).toBe(809200)
    expect(xpNeededForLevelRange(31, 50000, 42)).toBe(759200)
  })

  it("is 0 for an already-reached or inverted range", () => {
    expect(xpNeededForLevelRange(42, 0, 42)).toBe(0)
    expect(xpNeededForLevelRange(42, 0, 31)).toBe(0)
  })

  it("is 0 when total xp already gained covers the target level's own threshold", () => {
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

describe("consumeOwnedBooks", () => {
  it("returns the updated pool with spent books removed, for allocating the same pool across goals", () => {
    const result = consumeOwnedBooks(12_500, { Legendary: 2, Common: 5 })
    expect(result.remainingXp).toBe(0)
    expect(result.remainingOwned.Legendary).toBe(1)
    expect(result.remainingOwned.Common).toBe(5)
  })

  it("lets a second goal's allocation see what a first goal already spent", () => {
    const first = consumeOwnedBooks(12_500, { Legendary: 1 })
    expect(first.remainingXp).toBe(0)
    const second = consumeOwnedBooks(12_500, first.remainingOwned)
    expect(second.remainingXp).toBe(12_500)
  })

  it("doesn't mutate the input map", () => {
    const owned = { Legendary: 2 }
    consumeOwnedBooks(12_500, owned)
    expect(owned).toEqual({ Legendary: 2 })
  })
})

describe("maxLevelReachableWithXp", () => {
  it("returns currentLevel when no xp is available", () => {
    expect(maxLevelReachableWithXp(31, 0, 42, 0)).toBe(31)
  })

  it("walks up to the highest level the available xp fully covers", () => {
    // level32's own total-xp threshold is 94200, level33's is 122200 (ported xp.json thresholds).
    expect(maxLevelReachableWithXp(31, 0, 42, 94_199)).toBe(31)
    expect(maxLevelReachableWithXp(31, 0, 42, 94_200)).toBe(32)
    expect(maxLevelReachableWithXp(31, 0, 42, 122_199)).toBe(32)
    expect(maxLevelReachableWithXp(31, 0, 42, 122_200)).toBe(33)
  })

  it("caps at targetLevel even with far more xp available", () => {
    expect(maxLevelReachableWithXp(31, 0, 32, 999_999_999)).toBe(32)
  })

  it("credits total xp already gained toward the next level, not just a from-scratch amount", () => {
    // level32's own threshold is 94200 total xp; a character already at 80000 total only needs
    // 14200 more (94200-80000), not the full 94200 a from-scratch calculation would imply.
    expect(maxLevelReachableWithXp(31, 80_000, 32, 14_199)).toBe(31)
    expect(maxLevelReachableWithXp(31, 80_000, 32, 14_200)).toBe(32)
  })
})

describe("ownedBooksByRarity", () => {
  it("collapses a raw xpBooks inventory into owned-by-rarity via the real synced id map", () => {
    expect(
      ownedBooksByRarity([
        { xpBookId: "xpLegendary", amount: 3 },
        { xpBookId: "xpCommon", amount: 10 },
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
    // 809200 total xp needed / 12500 per Legendary book = 64.736, rounded up to 65.
    expect(cost).toEqual({ books: 65, gold: 32_500 })
  })

  it("nets against owned books before converting to a book count", () => {
    const cost = computeLevelGoalCost({
      currentLevel: 31,
      currentXp: 0,
      targetLevel: 32,
      // level32's own threshold is 94200 total xp; 8 Legendary books (100000) covers it.
      ownedXpBooks: [{ xpBookId: "xpLegendary", amount: 8 }],
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
