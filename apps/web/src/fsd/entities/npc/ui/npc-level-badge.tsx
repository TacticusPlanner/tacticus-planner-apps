import { useTranslation } from "react-i18next"
import { rankIcon, rarityIcon, starsVisual } from "@workspace/game-catalog"
import { rankAt } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { useRarityFromStars } from "../lib/rarity-from-stars"
import type { NpcStatRow } from "../model/types"

/**
 * A ladder row's rank, rarity and stars as the collection's roster row shows them: the rank icon,
 * the rarity icon (resolved from the star index once the progression rules load), then one star
 * icon with the star count (or the mythic wings). NPC rows carry the numeric rank index (0 = Stone
 * I, as V1 maps it) and the raw 0-14 star index. With `health` set (used for tied rank/stars rows)
 * the value is appended so options stay distinct.
 */
export function NpcLevelBadge({
  row,
  health,
  className,
}: {
  row: NpcStatRow
  health?: number
  className?: string
}) {
  const { t } = useTranslation(["progression", "library"])
  const rank = rankAt(row.rank)
  const rankLabel = t(`progression:ranks.${rank}`, { defaultValue: rank })
  const rarity = useRarityFromStars(row.stars)
  const visual = starsVisual(row.stars)

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      data-rarity={rarity}
      data-testid="npc-level-badge"
    >
      <EntityIcon src={rankIcon(rank)} alt={rankLabel} className="size-5" />
      {rarity ? (
        <EntityIcon
          src={rarityIcon(rarity)}
          alt={t(`progression:rarities.${rarity}`, { defaultValue: rarity })}
          className="size-4"
        />
      ) : null}
      {visual.kind === "none" ? null : visual.kind === "wings" ? (
        <EntityIcon
          src={visual.icon}
          alt=""
          className="h-4 w-auto"
          width={512}
          height={164}
        />
      ) : (
        <span
          className="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums"
          data-testid="npc-level-stars"
        >
          <EntityIcon src={visual.icon} alt="" className="size-3.5" />
          {visual.count}
        </span>
      )}
      {health !== undefined ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("library:npcs.healthAtLevel", {
            health: health.toLocaleString(),
          })}
        </span>
      ) : null}
    </span>
  )
}
