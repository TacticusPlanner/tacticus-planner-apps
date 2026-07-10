import type { Rank, Rarity } from "@workspace/game-catalog"

interface RankUpEntry {
  rank: Rank
  upgradeIds: string[]
}

export interface Character {
  id: string
  name: string
  rankUpUpgrades: RankUpEntry[]
}

export interface RecipeIngredient {
  material: string
  count: number
  recipe?: RecipeIngredient[] | null
}

export interface Upgrade {
  id: string
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
  upgradeIds: string[]
  /** True for the extra "point five" group shown at the target rank. */
  pointFive?: boolean
}

export interface BaseUpgradeNeed {
  id: string
  count: number
}

/** A single owned-inventory or applied-upgrade entry: `amount` copies of upgrade `id`. */
export interface UpgradeAmount {
  id: string
  amount: number
}
