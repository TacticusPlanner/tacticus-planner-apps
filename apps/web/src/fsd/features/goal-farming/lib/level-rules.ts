import type { ProgressionRulesStorageModel } from "@workspace/game-catalog"
import {
  isRank,
  rankOrder,
  rarityOrder,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

type XpBookRule = {
  id: string
  /** The XP one book gives when applied. */
  xp: number
  /** The gold paid to apply one book. */
  gold: number
}

/** The game's XP and rank-up level rules, from the served `progression-rules` dataset. */
export type LevelRules = {
  /** The total XP needed to reach level `index + 1` (level 1 needs none). */
  xpTotalAtLevel: readonly number[]
  xpBooks: Readonly<Record<Rarity, XpBookRule>>
  /** The XP level a character needs to rank up to each rank: the lowest XP level any of that rank's
   *  six upgrade slots needs. */
  rankToLevel: Readonly<Record<Rank, number>>
  /** The XP level each of a rank's six upgrade slots needs, in the game's slot order: column-major
   *  over the 2x3 grid, so indices 0/2/4 are the top row and 1/3/5 the bottom row. */
  slotLevels: Readonly<Record<Rank, readonly number[]>>
}

/** A module-level selector for `useCatalogDataset("progression-rules", …)`: undefined until the
 *  dataset is served, or when it lacks a book for some rarity or a slot row for some rank. */
export function toLevelRules(
  records: readonly Pick<
    ProgressionRulesStorageModel,
    "xpLevels" | "xpBooks" | "upgradeSlots"
  >[]
): LevelRules | undefined {
  const rules = records[0]
  if (!rules) return undefined

  const xpBooks: Partial<Record<Rarity, XpBookRule>> = {}
  for (const book of rules.xpBooks) {
    xpBooks[book.rarity] = { id: book.id, xp: book.xpIncrease, gold: book.gold }
  }
  const rankToLevel: Partial<Record<Rank, number>> = {}
  const slotLevels: Partial<Record<Rank, readonly number[]>> = {}
  for (const row of rules.upgradeSlots) {
    if (!isRank(row.rank)) continue
    rankToLevel[row.rank] = Math.min(...row.xpLevelRequirements)
    slotLevels[row.rank] = row.xpLevelRequirements
  }
  if (
    rarityOrder.some((rarity) => !xpBooks[rarity]) ||
    rankOrder.some((rank) => rankToLevel[rank] === undefined)
  ) {
    return undefined
  }

  return {
    xpTotalAtLevel: [0, ...rules.xpLevels],
    xpBooks: xpBooks as Record<Rarity, XpBookRule>,
    rankToLevel: rankToLevel as Record<Rank, number>,
    slotLevels: slotLevels as Record<Rank, readonly number[]>,
  }
}
