import { useTranslation } from "react-i18next"
import { rankIcon, type RankId } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** Rank icon + localized label. */
export function RankBadge({
  rank,
  className,
  iconClassName,
}: {
  rank: RankId
  className?: string
  iconClassName?: string
}) {
  const { t } = useTranslation("ranks")

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <EntityIcon
        src={rankIcon(rank)}
        alt=""
        className={cn("size-5 shrink-0", iconClassName)}
      />
      <span className="text-sm font-medium whitespace-nowrap">{t(rank)}</span>
    </span>
  )
}
