import { datamineAssetUrl, shardIcon } from "@workspace/game-catalog"

import type { GoalKind } from "./types"

/** The goal-type badge/card icon — the game's own art for the concept, not any one specific
 * unit/upgrade/item (see e.g. `EquipmentIcon` for the actual per-item icon used in the Equipment
 * creation picker). Rank and Upgrade share the upgrade icon, the resource goals the game's drop-table art for that
 * resource. `Ability` is the one kind whose icon depends on which entity it's for — a Character's
 * active/passive ability vs. a MoW's primary/secondary ability are visually distinct concepts
 * in-game, so `entityType` picks between them (defaults to the Character icon when unknown). */
export function goalTypeIcon(kind: GoalKind, entityType?: string): string {
  switch (kind) {
    case "Rank":
    case "Upgrade":
      // Same theme — both are fundamentally "farm this upgrade" goals.
      return datamineAssetUrl(`atlases/ui_icon_upgrade_generic.webp`)
    case "Ascension":
      return datamineAssetUrl(
        `droptables/ui_icon_droptable_ascensionOrbsLegendary.webp`
      )
    case "Ability":
      return entityType === "Mow"
        ? datamineAssetUrl(`droptables/ui_icon_droptable_MoWResource.webp`)
        : datamineAssetUrl(
            `droptables/ui_icon_droptable_abilityTokensLegendary.webp`
          )
    case "Unlock":
      return shardIcon("Regular")
  }
}
