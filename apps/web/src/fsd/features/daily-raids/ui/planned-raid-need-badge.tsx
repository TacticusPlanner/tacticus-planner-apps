import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { PlannedRaidNeed } from "../model/planned-raid-need"

/** A planned node row's "X upgrades left" badge; renders nothing when the node is raided out. */
export function PlannedRaidNeedBadge({
  need,
}: {
  need: PlannedRaidNeed | undefined
}) {
  const { t } = useTranslation("dailies")
  if (!need) return null
  return (
    <Badge className="shrink-0 tabular-nums" variant="outline">
      {need.unit === "shards"
        ? t("schedule.shardsLeft", { count: need.count })
        : t("schedule.upgradesLeft", { count: need.count })}
    </Badge>
  )
}
