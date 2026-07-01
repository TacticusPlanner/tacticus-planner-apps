import { useTranslation } from "react-i18next"
import { rankIcon, type Rank } from "@workspace/game-catalog"
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
  const { t } = useTranslation("ranks")

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5", className)}
    >
      <EntityIcon
        src={rankIcon(rank)}
        alt={showLabel ? "" : t(rank)}
        className={cn("size-5 shrink-0", iconClassName)}
      />
      {showLabel ? (
        <span className="text-sm font-medium whitespace-nowrap">{t(rank)}</span>
      ) : null}
    </span>
  )
}
