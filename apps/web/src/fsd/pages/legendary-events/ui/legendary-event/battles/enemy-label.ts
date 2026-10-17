import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { starsVisual } from "@workspace/game-catalog"
import { rankAt } from "@workspace/game-domain"

import { useNpcLabels } from "@/entities/npc"

import type { EnemyTileViewModel } from "./battles.view-model"

/**
 * A tile's display name and its spoken level: the raw id while `npcs` is pending (spec: tiles show
 * the raw id and no level), else the id-keyed localized name with the served name as fallback.
 */
export function useEnemyLabels() {
  const { t } = useTranslation(["legendaryEvents", "progression"])
  const { variationName } = useNpcLabels()

  const enemyName = useCallback(
    (tile: EnemyTileViewModel) =>
      tile.level === "pending"
        ? tile.npcId
        : variationName(tile.npcId, tile.npc?.name ?? tile.npcId),
    [variationName]
  )

  const levelText = useCallback(
    (tile: EnemyTileViewModel) => {
      if (tile.level === "pending") return undefined
      if (!tile.row) return t("battles.enemy.levelUnknown")
      const rank = rankAt(tile.row.rank)
      const rankLabel = t(`progression:ranks.${rank}`, { defaultValue: rank })
      const visual = starsVisual(tile.row.stars)
      if (visual.kind === "none") return rankLabel
      if (visual.kind === "wings") {
        return t("battles.enemy.levelWings", { rank: rankLabel })
      }
      return t("battles.enemy.levelStars", {
        rank: rankLabel,
        count: visual.count,
      })
    },
    [t]
  )

  /** "Grot, 7, Stone III 1 star" (design D5). */
  const tileLabel = useCallback(
    (tile: EnemyTileViewModel) =>
      [enemyName(tile), String(tile.count), levelText(tile)]
        .filter((part): part is string => part !== undefined)
        .join(", "),
    [enemyName, levelText]
  )

  return { enemyName, levelText, tileLabel }
}
