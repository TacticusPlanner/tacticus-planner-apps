import type { EquipmentId, Rarity } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

// Slot codes are free-form strings on the character record (e.g. "I_Crit") — there is no closed
// enum server-side, so unrecognized codes fall back to `undefined` rather than throwing.
const equipmentSlotInfo: Record<string, { slug: string }> = {
  I_Crit: { slug: "crit" },
  I_Block: { slug: "block" },
  I_Booster_Crit: { slug: "booster_crit" },
  I_Booster_Block: { slug: "booster_block" },
  I_Defensive: { slug: "defensive" },
}

export function equipmentSlotIcon(slot: string): string | undefined {
  const info = equipmentSlotInfo[slot]
  return info
    ? `${ASSET_BASE_PATH}/equipment/ui_icon_itemtype_${info.slug}.png`
    : undefined
}

// Layered the same way V1's equipment-icon.tsx does: the item's own art, a rarity-colored frame on
// top, and (for isRelic pieces) an extra relic frame overlay. Equipment ids match their asset
// filename directly (e.g. "I_Block_C002" -> ui_icon_item_I_Block_C002.png) — no slug transform
// needed, unlike character/mow ids.
export const EquipmentIcons = {
  fallback: `${ASSET_BASE_PATH}/equipment/ui_icon_item_unknown.png`,
  icon(id: EquipmentId): string {
    return `${ASSET_BASE_PATH}/equipment/ui_icon_item_${id}.png`
  },
  frame(rarity: Rarity): string {
    return `${ASSET_BASE_PATH}/misc/ui_frame_items_${rarity.toLowerCase()}.png`
  },
  relicFrame: `${ASSET_BASE_PATH}/misc/ui_frame_items_relic.png`,
} as const
