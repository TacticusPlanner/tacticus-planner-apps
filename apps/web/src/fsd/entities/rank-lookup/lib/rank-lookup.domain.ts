import type { Rank, Rarity, UnitId, UpgradeId } from "@workspace/game-domain"

interface RankUpEntry {
  rank: Rank
  upgradeIds: UpgradeId[]
}

export interface Character {
  id: UnitId
  name: string
  rankUpUpgrades: RankUpEntry[]
}

export interface RecipeIngredient {
  material: UpgradeId
  count: number
  recipe?: RecipeIngredient[] | null
}

export interface Upgrade {
  id: UpgradeId
  label: string
  rarity: Rarity
  stat: string
  /** True for crafted upgrades that require crafting from ingredient upgrades. */
  crafted: boolean
  recipe: RecipeIngredient[]
}

export interface RankUpGroup {
  fromRank: Rank
  toRank: Rank
  upgradeIds: UpgradeId[]
  /** True for the extra "point five" group shown at the target rank. */
  pointFive?: boolean
}

export interface BaseUpgradeNeed {
  id: UpgradeId
  count: number
}

/** A single owned-inventory or applied-upgrade entry: `amount` copies of upgrade `id`. */
export interface UpgradeAmount {
  id: UpgradeId
  amount: number
}
