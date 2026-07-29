import { ASSET_BASE_PATH } from "./asset-path"

// Regular vs Mythic shard icon — a unit's ascension cost switches currency once its progression
// reaches the Mythic tier (see goals' isMythicProgression), so callers showing a shard count pick
// whichever icon matches.
export function shardIcon(kind: "Regular" | "Mythic"): string {
  return kind === "Mythic"
    ? `${ASSET_BASE_PATH}/misc/ui_icon_character_shard_mythic_empty.png`
    : `${ASSET_BASE_PATH}/misc/ui_icon_character_shard_empty.png`
}
