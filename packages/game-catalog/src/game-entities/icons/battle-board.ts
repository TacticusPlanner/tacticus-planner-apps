import { LE_MAP_IDS } from "../le-map-ids"
import { QUEST_MAP_IDS } from "../quest-map-ids"
import { curatedAssetUrl } from "./asset-path"

/**
 * Full URL of a battle board image for a served board or map id, looking in `quest_maps` first and then
 * `le_maps`, or `undefined` when no image ships for that id (the caller renders a "map not available"
 * placeholder).
 */
export function battleBoardImage(boardId: string): string | undefined {
  if (QUEST_MAP_IDS.has(boardId)) {
    return curatedAssetUrl(`quest_maps/${boardId}.webp`)
  }
  return LE_MAP_IDS.has(boardId)
    ? curatedAssetUrl(`le_maps/${boardId}.webp`)
    : undefined
}
