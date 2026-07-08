import type { Rank, Rarity } from "@workspace/game-catalog"

import type { LocationView } from "@/shared/ui"

export type BaseUpgradeView = {
  id: string
  count: number
  /** Raw owned amount (applied to the character + inventory, base+crafted expanded to this base
   *  upgrade) — uncapped, so a player can see they have more than enough. 0 unless the "include my
   *  upgrades" toggle is on and the player is signed in. */
  owned: number
  /** `max(0, count - owned)` — never negative. Equals `count` when owned is 0. */
  missing: number
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
  /** True when this specific upgrade instance is already applied to the selected character (only
   *  set when the "include my upgrades" toggle is on) — a hard, positional fact, unlike the
   *  aggregate owned/missing counts on `BaseUpgradeView`. */
  owned: boolean
}

export type RankGroupView = {
  fromRank: Rank
  toRank: Rank
  pointFive?: boolean
  health: UpgradeView[]
  damage: UpgradeView[]
  armour: UpgradeView[]
}
