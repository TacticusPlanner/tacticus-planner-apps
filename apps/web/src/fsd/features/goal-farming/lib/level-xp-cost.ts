import { rarityOrder, type Rarity } from "@workspace/game-domain"

// Ported from V1's `src/data/xp.json` (`xpLevelThresholds`) — the cumulative XP required to reach
// each character level, 0 through 65 (V1's own table max; V2's level requirements only ever reach
// `maxCharacterLevel` (game-domain), but the full curve is kept for completeness/library
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

/** `xpBookId` -> rarity mapping, confirmed against a real synced account's own `inventory:summary`
 * record (`xpCommon`/`xpUncommon`/`xpRare`/`xpEpic`/`xpLegendary`/`xpMythic`) — an earlier best-guess
 * mapping here used a `"book"` prefix instead of `"xp"` (a plausible but wrong guess made before any
 * real synced ids were known), which silently zeroed out every owned book in `ownedBooksByRarity`
 * (no id ever matched) without erroring, so it went unnoticed until this was checked against real
 * data. An unrecognized id still simply contributes nothing to netting (see
 * `netXpAgainstOwnedBooks`), so an id that turns out wrong again degrades to "don't net that book"
 * rather than miscounting — but this exact set is now verified, not guessed. */
const xpBookIdRarity: Record<string, Rarity> = {
  xpCommon: "Common",
  xpUncommon: "Uncommon",
  xpRare: "Rare",
  xpEpic: "Epic",
  xpLegendary: "Legendary",
  xpMythic: "Mythic",
}

function totalXpAtLevel(level: number): number | undefined {
  return xpTotalAtLevel[level]
}

/** The XP still needed to reach `targetLevel`, given `currentXp` — the character's *total* XP
 * gained since level 1 (the real Tacticus API's own `xp` field is documented as "total XP gained
 * for character", not a per-level-reset partial amount — see `tacticus-planner-api`'s OpenAPI spec,
 * `Unit.xp`). `currentLevel` is only used as a fast-path validity guard (an already-reached or
 * inverted range needs no XP-table lookup at all); the XP math itself never re-derives it from
 * `currentLevel`, since `currentXp` alone already encodes how far past any given level's own
 * threshold the character is. 0 for an invalid/already-reached range. */
export function xpNeededForLevelRange(
  currentLevel: number,
  currentXp: number,
  targetLevel: number
): number {
  if (currentLevel >= targetLevel) return 0
  const targetLevelTotalXp = totalXpAtLevel(targetLevel - 1)
  if (targetLevelTotalXp === undefined) return 0
  const xpLeft = targetLevelTotalXp - currentXp
  return xpLeft > 0 ? xpLeft : 0
}

/** Spends owned books against `xpNeeded`, highest-value rarity first (most XP-efficient use of
 * what's owned), then spends any single remaining book of the lowest rarity that still has stock —
 * mirrors V1's `GoalsService.adjustNeededXp`. Returns both the still-unmet remainder and the
 * updated pool (books actually spent removed) — `ownedByRarity` itself isn't mutated, so a caller
 * allocating the same pool across several goals in priority order can feed one goal's
 * `remainingOwned` into the next. */
export function consumeOwnedBooks(
  xpNeeded: number,
  ownedByRarity: Partial<Record<Rarity, number>>
): { remainingXp: number; remainingOwned: Partial<Record<Rarity, number>> } {
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

  return { remainingXp: remaining, remainingOwned }
}

/** Nets `xpNeeded` against owned books — the still-unmet remainder alone, for a caller that only
 * needs a single goal's own cost preview (not a multi-goal shared-pool allocation; see
 * `consumeOwnedBooks` for that). `ownedByRarity` isn't mutated. */
export function netXpAgainstOwnedBooks(
  xpNeeded: number,
  ownedByRarity: Partial<Record<Rarity, number>>
): number {
  return consumeOwnedBooks(xpNeeded, ownedByRarity).remainingXp
}

/** How far (level, not levels-since-current) `availableXp` gets a character from
 * (`currentLevel`, `currentXp`), capped at `targetLevel` — the inverse of `xpNeededForLevelRange`,
 * scanning candidate levels one at a time since the level curve has no closed-form inverse. Used to
 * turn an amount of *allocated* XP (owned books, possibly shared with other goals — see
 * `consumeOwnedBooks`) into the "potential" level a level requirement's progress bar marks. */
export function maxLevelReachableWithXp(
  currentLevel: number,
  currentXp: number,
  targetLevel: number,
  availableXp: number
): number {
  let reachable = currentLevel
  for (let level = currentLevel + 1; level <= targetLevel; level++) {
    if (xpNeededForLevelRange(currentLevel, currentXp, level) > availableXp)
      break
    reachable = level
  }
  return reachable
}

/** Collapses a `{xpBookId, amount}[]` inventory into owned-by-rarity, via the `xpBookIdRarity` map
 * (see its own doc comment) — an unrecognized id is simply skipped. */
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

/** A level requirement's resource-cost preview (plan scope decision: books required + gold to apply,
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
