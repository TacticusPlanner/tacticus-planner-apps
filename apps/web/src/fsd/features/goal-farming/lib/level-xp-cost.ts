import { rarityOrder, type Rarity } from "@workspace/game-domain"
import { normalizeXpBookRarity } from "@/entities/planning-setting"

import type { LevelRules } from "./level-rules"

export { normalizeXpBookRarity }

/** V1's `pickXpBookRarity`: the preferred rarity, or the largest whose book fits inside `xp` when a
 * single preferred book would overshoot (the smallest rarity if even that overshoots). */
export function pickXpBookRarity(
  xp: number,
  preferred: Rarity,
  rules: LevelRules
): Rarity {
  if (rules.xpBooks[preferred].xp <= xp) return preferred
  const fitting = [...rarityOrder]
    .reverse()
    .find((rarity) => rules.xpBooks[rarity].xp <= xp)
  return fitting ?? rarityOrder[0] ?? "Common"
}

/** `remainingXp` expressed as a whole-book count of `rarity` (falls back to Legendary — see
 * `normalizeXpBookRarity`). 0 for a non-positive amount. */
export function xpBookEquivalent(
  remainingXp: number,
  rules: LevelRules,
  rarity?: string | null
): number {
  if (remainingXp <= 0) return 0
  return Math.ceil(
    remainingXp / rules.xpBooks[normalizeXpBookRarity(rarity)].xp
  )
}

export type LevelBookAvailability = {
  /** The shared owned-book pool's book-equivalent size at this goal's turn in priority order,
   *  floored (a partial book isn't obtainable from the pool). Not capped to `needed`. */
  available: number
  /** This goal's own charged XP interval, expressed as a book-equivalent count, ceiled (a partial
   *  book still costs a whole one to apply). 0 when the goal needs no further levels. */
  needed: number
}

/** Available/needed book-equivalent counts for a goal's own charged XP interval, in the user's
 * selected XP-book rarity (show-xp-book-availability-per-goal) — the priority-ordered-pool figures
 * `allocateLevelXp`/`buildLevelPotentialProgress` already compute (`chargedXp`, `poolXpAvailable`),
 * rounded only for display; see `xpBookEquivalent` for the single-value shortfall used elsewhere
 * (the create-goal preview). */
export function levelBookAvailability(
  chargedXp: number,
  poolXpAvailable: number,
  /** The XP one book of the selected rarity gives. */
  bookXp: number
): LevelBookAvailability {
  return {
    available: Math.max(0, Math.floor(poolXpAvailable / bookXp)),
    needed: Math.max(0, Math.ceil(chargedXp / bookXp)),
  }
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
  targetLevel: number,
  rules: LevelRules
): number {
  if (currentLevel >= targetLevel) return 0
  const targetLevelTotalXp = rules.xpTotalAtLevel[targetLevel - 1]
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
  ownedByRarity: Partial<Record<Rarity, number>>,
  rules: LevelRules
): { remainingXp: number; remainingOwned: Partial<Record<Rarity, number>> } {
  const remainingOwned = { ...ownedByRarity }
  const highestValueFirst = [...rarityOrder].reverse()

  let remaining = xpNeeded
  for (const rarity of highestValueFirst) {
    const owned = remainingOwned[rarity] ?? 0
    const value = rules.xpBooks[rarity].xp
    const usable = Math.min(Math.floor(remaining / value), owned)
    remainingOwned[rarity] = owned - usable
    remaining -= usable * value
  }

  if (remaining > 0) {
    for (const rarity of rarityOrder) {
      let owned = remainingOwned[rarity] ?? 0
      while (remaining > 0 && owned > 0) {
        remaining = Math.max(0, remaining - rules.xpBooks[rarity].xp)
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
  ownedByRarity: Partial<Record<Rarity, number>>,
  rules: LevelRules
): number {
  return consumeOwnedBooks(xpNeeded, ownedByRarity, rules).remainingXp
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
  availableXp: number,
  rules: LevelRules
): number {
  let reachable = currentLevel
  for (let level = currentLevel + 1; level <= targetLevel; level++) {
    if (
      xpNeededForLevelRange(currentLevel, currentXp, level, rules) > availableXp
    )
      break
    reachable = level
  }
  return reachable
}

/** Collapses a `{xpBookId, amount}[]` inventory into owned-by-rarity, matching each id against the
 * game's XP book ids (`xpCommon` … `xpMythic`, the same ids a synced account's inventory uses). An
 * unrecognized id is simply skipped, so it degrades to "don't net that book" rather than miscounting. */
export function ownedBooksByRarity(
  inventory: readonly { xpBookId: string; amount: number }[] | undefined,
  rules: LevelRules
): Partial<Record<Rarity, number>> {
  const rarityById = new Map(
    rarityOrder.map((rarity) => [rules.xpBooks[rarity].id, rarity])
  )
  const owned: Partial<Record<Rarity, number>> = {}
  for (const entry of inventory ?? []) {
    const rarity = rarityById.get(entry.xpBookId)
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
 * income rate this app doesn't have). Remaining XP after netting is expressed as a book count in
 * `rarity` (default/fallback Legendary — see `normalizeXpBookRarity`; surface-goal-farming-guidance's
 * XP-book rarity planning setting). `null` when nothing is actually needed. */
export function computeLevelGoalCost(params: {
  currentLevel: number
  currentXp: number
  targetLevel: number
  ownedXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
  rules: LevelRules
  rarity?: string | null
}): LevelGoalCost | null {
  const { rules } = params
  const xpNeeded = xpNeededForLevelRange(
    params.currentLevel,
    params.currentXp,
    params.targetLevel,
    rules
  )
  if (xpNeeded <= 0) return null

  const remaining = netXpAgainstOwnedBooks(
    xpNeeded,
    ownedBooksByRarity(params.ownedXpBooks, rules),
    rules
  )
  if (remaining <= 0) return null

  const books = xpBookEquivalent(remaining, rules, params.rarity)
  // Each book costs its own rarity's apply gold (`consumables.xpBooks[].gold`); V1's flat 500 was
  // only the Legendary price.
  const gold = books * rules.xpBooks[normalizeXpBookRarity(params.rarity)].gold
  return { books, gold }
}
