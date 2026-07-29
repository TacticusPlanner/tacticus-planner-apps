import type { Rarity } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

// Rarity badge icon (not a Snowprint asset — a custom app icon, same as V1's rarity/resized/*.png).
export function rarityIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/rarity/${rarity.toLowerCase()}.png`
}
