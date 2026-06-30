import type { RankId } from "@workspace/game-catalog"

export interface RankUpEntry {
  rank: string
  upgradeIds: string[]
}

export interface CharacterLike {
  id: string
  name: string
  rankUpUpgrades: RankUpEntry[]
}

export interface RecipeIngredient {
  material: string
  count: number
  recipe?: RecipeIngredient[] | null
}

export interface UpgradeLike {
  id: string
  label: string
  rarity: string
  stat: string
  craftable: boolean
  recipe: RecipeIngredient[]
}

export interface RankUpGroup {
  fromRank: RankId
  toRank: RankId
  upgradeIds: string[]
  /** True for the extra "point five" group shown at the target rank. */
  pointFive?: boolean
}

export interface BaseMaterialNeed {
  id: string
  count: number
}
