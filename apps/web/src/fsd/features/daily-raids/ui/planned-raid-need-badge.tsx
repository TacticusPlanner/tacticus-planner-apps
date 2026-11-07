import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { PlannedRaidNeed } from "../model/planned-raid-need"

/**
 * A planned node row's "X upgrades left" badge; renders nothing when the node is raided out.
 * `compact` shows the short "X more" form (full wording kept for screen readers) for location rows
 * where the resource is already shown next to it and the narrow mobile width is needed for the name.
 */
export function PlannedRaidNeedBadge({
  className,
  compact = false,
  need,
}: {
  className?: string
  compact?: boolean
  need: PlannedRaidNeed | undefined
}) {
  const { t } = useTranslation("dailies")
  if (!need) return null
  const full =
    need.unit === "shards"
      ? t("schedule.shardsLeft", { count: need.count })
      : t("schedule.upgradesLeft", { count: need.count })
  if (!compact) {
    return (
      <Badge
        className={cn("shrink-0 tabular-nums", className)}
        variant="outline"
      >
        {full}
      </Badge>
    )
  }
  return (
    <Badge
      className={cn("shrink-0 text-sm tabular-nums", className)}
      title={full}
      variant="outline"
    >
      <span aria-hidden>{t("schedule.more", { count: need.count })}</span>
      <span className="sr-only">{full}</span>
    </Badge>
  )
}
