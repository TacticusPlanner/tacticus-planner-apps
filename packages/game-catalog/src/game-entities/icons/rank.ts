import type { Rank } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

// All rank assets are named by Rank value (lowercase): stone1.png … adamantine3.png.
export function rankIcon(id: Rank): string {
  return `${ASSET_BASE_PATH}/ranks/${id.toLowerCase()}.png`
}
