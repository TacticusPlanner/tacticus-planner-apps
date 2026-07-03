import type { Rank, Rarity } from "@workspace/game-catalog"

import type { LocationView } from "@/shared/ui"

export type BaseUpgradeView = {
  id: string
  count: number
  label: string
  rarity: Rarity
  crafted: boolean
  campaignLocations: LocationView[]
  eventLocations: LocationView[]
}

export type RecipeView = {
  id: string
  label: string
  count: number
  rarity: Rarity
  crafted: boolean
  children: RecipeView[]
}

export type UpgradeView = {
  id: string
  label: string
  rarity: Rarity
  crafted: boolean
  recipe: RecipeView[]
}

export type RankGroupView = {
  fromRank: Rank
  toRank: Rank
  pointFive?: boolean
  health: UpgradeView[]
  damage: UpgradeView[]
  armour: UpgradeView[]
}
