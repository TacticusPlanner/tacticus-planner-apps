import type { Rank, Rarity } from "@workspace/game-catalog"

import type { LocationViewModel } from "@/shared/ui"

export type BaseUpgradeViewModel = {
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
  campaignLocations: LocationViewModel[]
  eventLocations: LocationViewModel[]
}

export type RecipeViewModel = {
  id: string
  label: string
  count: number
  rarity: Rarity
  crafted: boolean
  children: RecipeViewModel[]
}

export type UpgradeViewModel = {
  id: string
  label: string
  rarity: Rarity
  crafted: boolean
  recipe: RecipeViewModel[]
  /** True when this specific upgrade instance is already applied to the selected character (only
   *  set when the "include my upgrades" toggle is on) — a hard, positional fact, unlike the
   *  aggregate owned/missing counts on `BaseUpgradeViewModel`. */
  owned: boolean
}

export type RankGroupViewModel = {
  fromRank: Rank
  toRank: Rank
  pointFive?: boolean
  health: UpgradeViewModel[]
  damage: UpgradeViewModel[]
  armour: UpgradeViewModel[]
}
