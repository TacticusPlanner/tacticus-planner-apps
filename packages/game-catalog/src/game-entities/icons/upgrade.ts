import type { Rarity, UpgradeId } from "@workspace/game-domain"

import { datamineAssetUrl, gameAssetUrl } from "./asset-path"

export const UpgradeIcons = {
  fallback: datamineAssetUrl(`atlases/ui_icon_upgrade_unknown.webp`),
  // Background plate rendered behind every upgrade material icon (see V1's upgrade-image.tsx).
  underlay: datamineAssetUrl(`atlases/ui_underlay_upgrades.webp`),
  // Badge overlaid on the bottom-left corner of a crafted (non-base) upgrade's icon.
  craftedBadge: gameAssetUrl(`upgrade-crafted-badge.webp`),
  icon(id: UpgradeId): string {
    return datamineAssetUrl(`upgrades/ui_icon_upgrade_${id}.webp`)
  },
  // Rarity-colored border rendered on top of the upgrade material icon.
  frame(rarity: Rarity): string {
    return datamineAssetUrl(
      `atlases/ui_frame_upgrades_${rarity.toLowerCase()}.webp`
    )
  },
} as const
