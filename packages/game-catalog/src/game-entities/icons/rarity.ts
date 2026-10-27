import type { Rarity } from "@workspace/game-domain"

import { curatedAssetUrl } from "./asset-path"

// Rarity markers are the planner's own art (kept curated by choice), not a game sprite.
export function rarityIcon(rarity: Rarity): string {
  return curatedAssetUrl(`rarity/${rarity.toLowerCase()}.webp`)
}
