import { useTranslation } from "react-i18next"
import { rankIcon, starsVisual } from "@workspace/game-catalog"
import { rankAt } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type { NpcStatRow } from "@/entities/npc"

/**
 * A ladder row's rank and stars as icons. NPC rows carry the numeric rank index (0 = Stone I, as V1
 * maps it) and the raw 0-14 star index, so this reuses the roster's rank asset and star/wings rule.
 * With `health` set (used for tied rank/stars rows) the value is appended so options stay distinct.
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
  const visual = starsVisual(row.stars)

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <EntityIcon src={rankIcon(rank)} alt={rankLabel} className="size-5" />
      {visual.kind === "none" ? null : visual.kind === "wings" ? (
        <EntityIcon src={visual.icon} alt="" className="h-4 w-auto" />
      ) : (
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: visual.count }, (_, index) => (
            <EntityIcon
              key={index}
              src={visual.icon}
              alt=""
              className="size-3.5"
            />
          ))}
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
