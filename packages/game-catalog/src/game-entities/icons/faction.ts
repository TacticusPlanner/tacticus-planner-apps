import { ASSET_BASE_PATH } from "./asset-path"

// Faction emblems ship as `factions/<FactionId>.png` (copied from V1 `assets/images/factions`, renamed
// from display names to ids). The faction-less NPC bucket (`Objects`) has no emblem.
export function factionIcon(factionId: string): string | undefined {
  if (factionId === "Objects") return undefined
  return `${ASSET_BASE_PATH}/factions/${factionId}.png`
}
