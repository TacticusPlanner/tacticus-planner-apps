import { rarityOrder, type Rarity } from "@workspace/game-domain"
import { normalizeXpBookRarity } from "@/entities/planning-setting"

import {
  consumeOwnedBooks,
  maxLevelReachableWithXp,
  ownedBooksByRarity,
  pickXpBookRarity,
  xpBookGoldByRarity,
  xpBookValueByRarity,
  xpNeededForLevelRange,
} from "./level-xp-cost"

/** Sums a book pool's raw XP value across every rarity — used to report the shared pool's size at a
 *  point in the priority-ordered allocation below (surface-goal-farming-guidance's available/needed
 *  book display), independent of which rarities actually make up the pool. */
function poolXpTotal(pool: Partial<Record<Rarity, number>>): number {
  return rarityOrder.reduce(
    (sum, rarity) => sum + (pool[rarity] ?? 0) * xpBookValueByRarity[rarity],
    0
  )
}

/** One goal's level requirement, anchored to its unit's *current* level and total XP. */
export type LevelXpNeed = {
  goalId: string
  /** The unit every goal of it shares XP through — entity type plus id. */
  unitKey: string
  priority: number
  currentLevel: number
  currentXp: number
  requiredLevel: number
}

export type LevelXpAllocation = {
  /** XP newly charged to this goal: the interval from the highest level a higher-priority goal of the
   *  same unit already covers up to this goal's own required level (0 when fully covered already). */
  chargedXp: number
  /** The level a higher-priority goal of the same unit already covers up to, when that lies strictly
   *  between this goal's current and required level: the goal's own charged interval starts there
   *  (a second Rank goal reads "Lv 35 -> 38" chained after the first goal's 35, not "Lv 33 -> 38").
   *  `null` when no earlier goal covers a level inside this goal's range. */
  chainedFromLevel: number | null
  /** The highest level (capped at `requiredLevel`) the unit could reach *right now* by spending the
   *  account's owned XP books on this goal and every higher-priority goal of the same unit. */
  potentialLevel: number
  /** `chargedXp` still unmet after spending owned XP books on this goal and every higher-priority goal
   *  of the same unit, in global goal order (surface-goal-farming-guidance) — the raw-XP figure a
   *  caller converts to an *additional* book-equivalent count in the user's selected rarity via
   *  `xpBookEquivalent`. 0 once owned books fully cover this goal's own interval. */
  remainingXp: number
  /** The shared owned-book pool's raw XP total at this goal's own turn in priority order, captured
   *  before this goal spends from it (show-xp-book-availability-per-goal) — the raw-XP figure a caller
   *  converts to an available book-equivalent count in the user's selected rarity, floored (a partial
   *  book isn't obtainable from the pool). Not capped to `chargedXp`: a goal whose pool exceeds its own
   *  need reports the full surplus, not a value clamped to what it needs. */
  poolXpAvailable: number
  /** Gold to apply the books this goal needs (V1's Rank "Gold"): every owned book it spends at its own
   *  rarity's price, plus the books still to be obtained at the selected rarity's price. */
  gold: number
}

/** Allocates the account's shared, indivisible XP-book pool across every goal that needs a level, in
 *  priority order — one pass for Rank milestones and Ability goals alike. Per unit the XP interval is
 *  counted once: a lower-priority goal is charged only the XP beyond what a higher-priority goal of the
 *  same unit already covers, so two Rank milestones (or a Rank and an Ability goal) never double-count
 *  the same levels or the same books. Applying a book is all-or-nothing in-game (see
 *  `consumeOwnedBooks`), so leftover XP within a spent book still counts toward the goal that spent it
 *  and never a later one. A goal already at its required level gets no entry. */
export function allocateLevelXp(
  needs: readonly LevelXpNeed[],
  ownedXpBooks: readonly { xpBookId: string; amount: number }[] | undefined,
  /** The user's selected XP-book rarity, used only to price the books still to be obtained. */
  xpBookRarity?: string | null
): Map<string, LevelXpAllocation> {
  let pool = ownedBooksByRarity(ownedXpBooks)
  const coveredXpByUnit = new Map<string, number>()
  const spentXpByUnit = new Map<string, number>()
  const coveredLevelByUnit = new Map<string, number>()
  const result = new Map<string, LevelXpAllocation>()

  for (const need of [...needs].sort((a, b) => a.priority - b.priority)) {
    const xpToRequired = xpNeededForLevelRange(
      need.currentLevel,
      need.currentXp,
      need.requiredLevel
    )
    if (xpToRequired <= 0) continue

    const alreadyCovered = coveredXpByUnit.get(need.unitKey) ?? 0
    const chargedXp = Math.max(0, xpToRequired - alreadyCovered)
    const poolXpAvailable = poolXpTotal(pool)
    const { remainingXp, remainingOwned } = consumeOwnedBooks(chargedXp, pool)
    const heldGold = rarityOrder.reduce(
      (sum, rarity) =>
        sum +
        ((pool[rarity] ?? 0) - (remainingOwned[rarity] ?? 0)) *
          xpBookGoldByRarity[rarity],
      0
    )
    const displayRarity = pickXpBookRarity(
      chargedXp,
      normalizeXpBookRarity(xpBookRarity)
    )
    const gold =
      heldGold +
      Math.ceil(remainingXp / xpBookValueByRarity[displayRarity]) *
        xpBookGoldByRarity[displayRarity]
    pool = remainingOwned

    const spentXp =
      (spentXpByUnit.get(need.unitKey) ?? 0) + (chargedXp - remainingXp)
    spentXpByUnit.set(need.unitKey, spentXp)
    coveredXpByUnit.set(need.unitKey, Math.max(alreadyCovered, xpToRequired))
    const coveredLevel = coveredLevelByUnit.get(need.unitKey) ?? 0
    coveredLevelByUnit.set(
      need.unitKey,
      Math.max(coveredLevel, need.requiredLevel)
    )

    result.set(need.goalId, {
      chargedXp,
      chainedFromLevel:
        coveredLevel > need.currentLevel && coveredLevel < need.requiredLevel
          ? coveredLevel
          : null,
      potentialLevel: maxLevelReachableWithXp(
        need.currentLevel,
        need.currentXp,
        need.requiredLevel,
        spentXp
      ),
      remainingXp,
      poolXpAvailable,
      gold,
    })
  }
  return result
}
