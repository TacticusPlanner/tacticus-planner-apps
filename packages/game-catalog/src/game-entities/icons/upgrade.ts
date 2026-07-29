import type { Rarity, UpgradeId } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

export const UpgradeIcons = {
  fallback: `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_unknown.png`,
  // Background plate rendered behind every upgrade material icon (see V1's upgrade-image.tsx).
  underlay: `${ASSET_BASE_PATH}/frames/ui_underlay_upgrades.png`,
  // Badge overlaid on the bottom-left corner of a crafted (non-base) upgrade's icon.
  craftedBadge: `${ASSET_BASE_PATH}/upgrade-crafted-badge.png`,
  icon(id: UpgradeId): string {
    return `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_${id}.png`
  },
  // Rarity-colored border rendered on top of the upgrade material icon.
  frame(rarity: Rarity): string {
    return `${ASSET_BASE_PATH}/frames/ui_frame_upgrades_${rarity.toLowerCase()}.png`
  },
} as const
