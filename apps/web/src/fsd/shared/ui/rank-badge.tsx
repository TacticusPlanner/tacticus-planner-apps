import { useTranslation } from "react-i18next"
import { rankIcon } from "@workspace/game-catalog"
import type { Rank } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** Rank icon + localized label. With `showLabel={false}` the label is dropped; pass `tooltip` to
 * surface it on hover instead (mirrors `RarityIcon`). */
export function RankBadge({
  rank,
  className,
  iconClassName,
  showLabel = true,
  tooltip = false,
}: {
  rank: Rank
  className?: string
  iconClassName?: string
  showLabel?: boolean
  tooltip?: boolean
}) {
  const { t } = useTranslation("progression")
  const label = t(`ranks.${rank}`, { defaultValue: rank })

  const badge = (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5", className)}
    >
      <EntityIcon
        src={rankIcon(rank)}
        alt={showLabel ? "" : label}
        className={cn("size-5 shrink-0", iconClassName)}
      />
      {showLabel ? (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      ) : null}
    </span>
  )

  if (!tooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
