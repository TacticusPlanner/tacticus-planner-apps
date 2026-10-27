import { datamineAssetUrl, gameAssetUrl } from "@workspace/game-catalog"

import type { GoalKind } from "./types"

const genericUpgradeIcon = datamineAssetUrl(
  `atlases/ui_icon_upgrade_generic.webp`
)

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
      return gameAssetUrl(`misc/orbs_generic.webp`)
    case "Ability":
      return entityType === "Mow"
        ? gameAssetUrl(`misc/components_generic.webp`)
        : gameAssetUrl(`misc/ability_badges_generic.webp`)
    case "Unlock":
      return gameAssetUrl(`misc/ui_icon_character_shard_empty.webp`)
  }
}
