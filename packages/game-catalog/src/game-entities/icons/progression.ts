import { progressionStarsIndex, type Progression } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

// Gold/red stars aren't Snowprint assets (V1 sources them from its own app icon set); the blue
// star and mythic wings are (V1's `snowprintIcons.blueStar`/`.mythicWings`).
const goldStarIcon = `${ASSET_BASE_PATH}/stars/gold.png`
const redStarIcon = `${ASSET_BASE_PATH}/stars/red.png`
const blueStarIcon = `${ASSET_BASE_PATH}/stars/ui_icon_star_legendary_large.png`
const mythicWingsIcon = `${ASSET_BASE_PATH}/stars/ui_icon_star_mythic.png`

export type ProgressionVisual =
  | { kind: "none" }
  | { kind: "stars"; icon: string; count: number }
  | { kind: "wings"; icon: string }

// Ported from V1's stars.icon.tsx: None renders as plain text (no icon); 1-5 stars are gold,
// 6-10 are red, 11-13 are blue, and the max step (14) renders as a single wings image instead of
// 14 individual stars.
export function progressionVisual(value: Progression): ProgressionVisual {
  const index = progressionStarsIndex(value)
  if (index === 0) return { kind: "none" }
  if (index <= 5) return { kind: "stars", icon: goldStarIcon, count: index }
  if (index <= 10) {
    return { kind: "stars", icon: redStarIcon, count: index - 5 }
  }
  if (index <= 13) {
    return { kind: "stars", icon: blueStarIcon, count: index - 10 }
  }
  return { kind: "wings", icon: mythicWingsIcon }
}
