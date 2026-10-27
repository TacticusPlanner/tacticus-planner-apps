import { rankIndex, type Rank } from "@workspace/game-domain"

import { datamineAssetUrl } from "./asset-path"

// The game ships its rank badges as `fonts/Rank_<n>.webp`, numbered in ladder order from Stone I (0);
// Silver III alone ships under another name.
export function rankIcon(id: Rank): string {
  const index = rankIndex(id)
  return datamineAssetUrl(
    index === 11 ? "fonts/IdunTextRRank_11.webp" : `fonts/Rank_${index}.webp`
  )
}
