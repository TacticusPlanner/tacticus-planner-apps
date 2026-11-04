import type { Rarity } from "@workspace/game-domain"

// Styles a unit's Cards tile and Roster row share.

export const rarityColor = (rarity: Rarity) =>
  `var(--rarity-${rarity.toLowerCase()})`

// Black outline so a count stays readable over the bright shard crystal and portrait art.
export const outlinedText =
  "[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,0_1px_3px_rgb(0_0_0/0.8)]"
