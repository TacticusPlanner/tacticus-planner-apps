import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { rankIcon, type RankId } from "@/entities/rank"

import { EntityIcon } from "./entity-icon"

/** Rank icon (where available) + localized label. Adamantine ranks have no icon and show label only. */
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
  const icon = rankIcon(rank)

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {icon ? (
        <EntityIcon
          src={icon}
          alt=""
          className={cn("size-5 shrink-0", iconClassName)}
        />
      ) : null}
      <span className="text-sm font-medium whitespace-nowrap">{t(rank)}</span>
    </span>
  )
}
