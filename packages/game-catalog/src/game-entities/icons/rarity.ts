import type { Rarity } from "@workspace/game-domain"

import { gameAssetUrl } from "./asset-path"

// Rarity badge icon (not a Snowprint asset — a custom app icon, same as V1's rarity/resized/*.webp).
export function rarityIcon(rarity: Rarity): string {
  return gameAssetUrl(`rarity/${rarity.toLowerCase()}.webp`)
}
