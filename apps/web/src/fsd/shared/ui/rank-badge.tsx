import { useTranslation } from "react-i18next"
import { rankIcon } from "@workspace/game-catalog"
import type { Rank } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** Rank icon + localized label. */
export function RankBadge({
  rank,
  className,
  iconClassName,
  showLabel = true,
}: {
  rank: Rank
  className?: string
  iconClassName?: string
  showLabel?: boolean
}) {
  const { t } = useTranslation("progression")

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5", className)}
    >
      <EntityIcon
        src={rankIcon(rank)}
        alt={showLabel ? "" : t(`ranks.${rank}`, { defaultValue: rank })}
        className={cn("size-5 shrink-0", iconClassName)}
      />
      {showLabel ? (
        <span className="text-sm font-medium whitespace-nowrap">
          {t(`ranks.${rank}`, { defaultValue: rank })}
        </span>
      ) : null}
    </span>
  )
}
