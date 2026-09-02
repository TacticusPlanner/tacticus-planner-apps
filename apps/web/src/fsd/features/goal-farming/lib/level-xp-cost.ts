import { rarityOrder, type Rarity } from "@workspace/game-domain"

// Ported from V1's `src/data/xp.json` (`xpLevelThresholds`) — the cumulative XP required to reach
// each character level, 0 through 65 (V1's own table max; V2's Level goal only ever targets up to
// MAX_CHARACTER_LEVEL, see goal-validation.ts, but the full curve is kept for completeness/library
// symmetry with V1). `totalXp` is cumulative from level 0, `xpToNextLevel` unused here.
const xpTotalAtLevel: readonly number[] = [
  0, 25, 60, 120, 200, 300, 420, 560, 720, 900, 1100, 1350, 1650, 2000, 2400,
  2850, 3350, 3950, 4700, 5600, 6700, 8100, 9900, 12200, 15200, 19200, 24700,
  32200, 42200, 55200, 72200, 94200, 122200, 157200, 200200, 252200, 314200,
  387200, 472200, 570200, 682200, 809200, 952200, 1112200, 1290200, 1487200,
  1704200, 1942200, 2202200, 2485200, 2775200, 3070200, 3370200, 3675200,
  3985200, 4300200, 4620200, 4945200, 5275200, 5610200, 5950200, 6295200,
  6645200, 7000200, 7360200,
]

/** Ported from V1's `XP_BOOK_VALUE` (`rarity.enum.ts`) — the XP a single book of each rarity is
 * worth when applied. */
const xpBookValueByRarity: Record<Rarity, number> = {
  Common: 20,
  Uncommon: 100,
  Rare: 500,
  Epic: 2_500,
  Legendary: 12_500,
  Mythic: 62_500,
}

/** Gold cost to apply a single book, independent of rarity (V1's `legendaryTomeApplyCost`). */
const XP_BOOK_APPLY_GOLD = 500

/** Best-guess `xpBookId` -> rarity mapping (no real Tacticus API ids are documented anywhere in
 * this repo — V1 never tracked xp books by id, only by rarity — so this follows the naming pattern
 * already used by the `player-data-sync.test.ts` fixture, e.g. "bookCommon"). Correct this once the
 * real synced ids are known; until then, an unrecognized id simply contributes nothing to netting
 * (see `netXpAgainstOwnedBooks`), so a wrong guess degrades to "don't net that book" rather than
 * miscounting. */
const xpBookIdRarity: Record<string, Rarity> = {
  bookCommon: "Common",
  bookUncommon: "Uncommon",
  bookRare: "Rare",
  bookEpic: "Epic",
  bookLegendary: "Legendary",
  bookMythic: "Mythic",
}

function totalXpAtLevel(level: number): number | undefined {
  return xpTotalAtLevel[level]
}

/** The XP still needed to go from `currentLevel` (with `currentXp` already earned toward the next
 * level) to `targetLevel` — mirrors V1's `CharactersXpService.getLegendaryTomesCount`'s own xpLeft
 * calc. 0 for an invalid/already-reached range. */
export function xpNeededForLevelRange(
  currentLevel: number,
  currentXp: number,
  targetLevel: number
): number {
  if (currentLevel >= targetLevel) return 0
  const currentLevelTotalXp = totalXpAtLevel(currentLevel - 1)
  const targetLevelTotalXp = totalXpAtLevel(targetLevel - 1)
  if (currentLevelTotalXp === undefined || targetLevelTotalXp === undefined) {
    return 0
  }
  const xpLeft = targetLevelTotalXp - currentLevelTotalXp - currentXp
  return xpLeft > 0 ? xpLeft : 0
}

/** Nets `xpNeeded` against owned books, highest-value rarity first (most XP-efficient use of what's
 * owned), then spends any single remaining book of the lowest rarity that still has stock — mirrors
 * V1's `GoalsService.adjustNeededXp`. `ownedByRarity` isn't mutated. */
export function netXpAgainstOwnedBooks(
  xpNeeded: number,
  ownedByRarity: Partial<Record<Rarity, number>>
): number {
  const remainingOwned = { ...ownedByRarity }
  const highestValueFirst = [...rarityOrder].reverse()

  let remaining = xpNeeded
  for (const rarity of highestValueFirst) {
    const owned = remainingOwned[rarity] ?? 0
    const value = xpBookValueByRarity[rarity]
    const usable = Math.min(Math.floor(remaining / value), owned)
    remainingOwned[rarity] = owned - usable
    remaining -= usable * value
  }

  if (remaining > 0) {
    for (const rarity of rarityOrder) {
      let owned = remainingOwned[rarity] ?? 0
      while (remaining > 0 && owned > 0) {
        remaining = Math.max(0, remaining - xpBookValueByRarity[rarity])
        owned -= 1
      }
      remainingOwned[rarity] = owned
    }
  }

  return remaining
}

/** Collapses a `{xpBookId, amount}[]` inventory into owned-by-rarity, via the best-guess
 * `xpBookIdRarity` map (see its own doc comment) — an unrecognized id is simply skipped. */
export function ownedBooksByRarity(
  inventory: readonly { xpBookId: string; amount: number }[] | undefined
): Partial<Record<Rarity, number>> {
  const owned: Partial<Record<Rarity, number>> = {}
  for (const entry of inventory ?? []) {
    const rarity = xpBookIdRarity[entry.xpBookId]
    if (!rarity) continue
    owned[rarity] = (owned[rarity] ?? 0) + entry.amount
  }
  return owned
}

export type LevelGoalCost = {
  books: number
  gold: number
}

/** The Level goal's resource-cost preview (plan scope decision: books required + gold to apply,
 * netted against owned books — no "days left" estimate, since XP books aren't farmed from campaign
 * energy the way upgrade materials are; V1 only computes that from a manually-configured per-day
 * income rate this app doesn't have). Remaining XP after netting is expressed as a Legendary-book
 * count (V1's own default reference rarity). `null` when nothing is actually needed. */
export function computeLevelGoalCost(params: {
  currentLevel: number
  currentXp: number
  targetLevel: number
  ownedXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
}): LevelGoalCost | null {
  const xpNeeded = xpNeededForLevelRange(
    params.currentLevel,
    params.currentXp,
    params.targetLevel
  )
  if (xpNeeded <= 0) return null

  const remaining = netXpAgainstOwnedBooks(
    xpNeeded,
    ownedBooksByRarity(params.ownedXpBooks)
  )
  if (remaining <= 0) return null

  const books = Math.ceil(remaining / xpBookValueByRarity.Legendary)
  return { books, gold: books * XP_BOOK_APPLY_GOLD }
}
