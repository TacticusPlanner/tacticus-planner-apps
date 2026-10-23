import type { Rank } from "@workspace/game-domain"

import { gameAssetUrl } from "./asset-path"

// All rank assets are named by Rank value (lowercase): stone1.webp … adamantine3.webp.
export function rankIcon(id: Rank): string {
  return gameAssetUrl(`ranks/${id.toLowerCase()}.webp`)
}
