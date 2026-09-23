import { npcPortraitOverrides } from "../npc-portrait-overrides"
import { ASSET_BASE_PATH } from "./asset-path"

/**
 * Full portrait URL for an NPC variation id, or `undefined` when no asset is mapped (the caller renders
 * an initials badge). Unlike `characterIcon`, nothing is derived from the id — see the override map.
 */
export function npcPortrait(id: string): string | undefined {
  const file = npcPortraitOverrides[id]
  return file ? `${ASSET_BASE_PATH}/characters/${file}` : undefined
}
