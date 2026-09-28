import {
  consumeOwnedBooks,
  maxLevelReachableWithXp,
  ownedBooksByRarity,
  xpNeededForLevelRange,
} from "./level-xp-cost"

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
  /** The highest level (capped at `requiredLevel`) the unit could reach *right now* by spending the
   *  account's owned XP books on this goal and every higher-priority goal of the same unit. */
  potentialLevel: number
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
  ownedXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
): Map<string, LevelXpAllocation> {
  let pool = ownedBooksByRarity(ownedXpBooks)
  const coveredXpByUnit = new Map<string, number>()
  const spentXpByUnit = new Map<string, number>()
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
    const { remainingXp, remainingOwned } = consumeOwnedBooks(chargedXp, pool)
    pool = remainingOwned

    const spentXp =
      (spentXpByUnit.get(need.unitKey) ?? 0) + (chargedXp - remainingXp)
    spentXpByUnit.set(need.unitKey, spentXp)
    coveredXpByUnit.set(need.unitKey, Math.max(alreadyCovered, xpToRequired))

    result.set(need.goalId, {
      chargedXp,
      potentialLevel: maxLevelReachableWithXp(
        need.currentLevel,
        need.currentXp,
        need.requiredLevel,
        spentXp
      ),
    })
  }
  return result
}
