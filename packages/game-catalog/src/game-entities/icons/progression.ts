import { progressionStarsIndex, type Progression } from "@workspace/game-domain"

import { datamineAssetUrl } from "./asset-path"

// The game's hero-detail stars: gold, red (epic), blue (legendary), and the mythic wings.
const goldStarIcon = datamineAssetUrl(`atlases/ui_icon_star_herodetail_01.webp`)
const redStarIcon = datamineAssetUrl(
  `atlases/ui_icon_star_herodetail_epic_01.webp`
)
const blueStarIcon = datamineAssetUrl(
  `atlases/ui_icon_star_legendary_large_01.webp`
)
const mythicWingsIcon = datamineAssetUrl(
  `atlases/ui_icon_star_mythic_large_01.webp`
)

export type ProgressionVisual =
  | { kind: "none" }
  | { kind: "stars"; icon: string; count: number }
  | { kind: "wings"; icon: string }

// None renders as plain text (no icon); 1-5 stars are gold,
// 6-10 are red, 11-13 are blue, and the max step (14) renders as a single wings image instead of
// 14 individual stars.
export function progressionVisual(value: Progression): ProgressionVisual {
  return starsVisual(progressionStarsIndex(value))
}

/** The same star/wings rule keyed by the raw 0-14 star index (NPC ladders carry it directly). */
export function starsVisual(index: number): ProgressionVisual {
  if (index <= 0) return { kind: "none" }
  if (index <= 5) return { kind: "stars", icon: goldStarIcon, count: index }
  if (index <= 10) {
    return { kind: "stars", icon: redStarIcon, count: index - 5 }
  }
  if (index <= 13) {
    return { kind: "stars", icon: blueStarIcon, count: index - 10 }
  }
  return { kind: "wings", icon: mythicWingsIcon }
}
