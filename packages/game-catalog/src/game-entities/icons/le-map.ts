import { LE_MAP_IDS } from "../le-map-ids"
import { gameAssetUrl } from "./asset-path"

/**
 * Full URL of a Legendary Event battle's tactical map for its served `mapId`, or `undefined` when no
 * image ships for that id (the caller renders a "map not available" placeholder).
 */
export function legendaryEventMap(mapId: string): string | undefined {
  return LE_MAP_IDS.has(mapId)
    ? gameAssetUrl(`le_maps/${mapId}.webp`)
    : undefined
}
