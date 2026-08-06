import { ASSET_BASE_PATH } from "@workspace/game-catalog"

import type { GoalKind } from "./types"

const genericUpgradeIcon = `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_generic.png`
const genericLevelIcon = `${ASSET_BASE_PATH}/misc/xp_generic.png`

/** The goal-type badge/card icon — a generic per-kind symbol representing the concept, not any one
 * specific unit/upgrade/item (see e.g. `EquipmentIcon` for the actual per-item icon used in the
 * Equipment creation picker). `Ability` is the one kind whose icon depends on which entity it's
 * for — a Character's active/passive ability vs. a MoW's primary/secondary ability are visually
 * distinct concepts in-game, so `entityType` picks between them (defaults to the Character icon
 * when unknown). */
export function goalTypeIcon(kind: GoalKind, entityType?: string): string {
  switch (kind) {
    case "Rank":
    case "Upgrade":
      // Same theme — both are fundamentally "farm this upgrade" goals.
      return genericUpgradeIcon
    case "Ascension":
      return `${ASSET_BASE_PATH}/misc/orbs_generic.png`
    case "Ability":
      return entityType === "Mow"
        ? `${ASSET_BASE_PATH}/misc/components_generic.png`
        : `${ASSET_BASE_PATH}/misc/ability_badges_generic.png`
    case "Unlock":
      return `${ASSET_BASE_PATH}/misc/ui_icon_character_shard_empty.png`
    case "UpgradeItem":
      return `${ASSET_BASE_PATH}/misc/forge_badges_generic.png`
    case "Level":
      return genericLevelIcon
  }
}
