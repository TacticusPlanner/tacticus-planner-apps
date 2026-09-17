import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import { EntityIcon } from "@/shared/ui"

import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import type { FlattenedRaidLocation } from "../model/flatten-today-locations"
import { ResourceIconWithTooltip } from "./resource-icon"

/** One flattened battle location: compact location chip, planned raid count, and its primary
 * reward — no unit portrait, goal-type icon, or character/goal label (home-raids-widget spec:
 * "one row per location ... without relation to character"). */
export function LocationRow({
  entry,
  location,
  resourceLabel,
  resourceVisual,
}: {
  entry: FlattenedRaidLocation
  location: DailyRaidLocationViewModel | undefined
  resourceLabel: string
  resourceVisual: DailyRaidResourceVisual | undefined
}) {
  const { t } = useTranslation("dailies")

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
      data-testid={`home-raid-location-${entry.battleId}`}
    >
      {location?.icon ? (
        <EntityIcon alt="" className="size-6 shrink-0" src={location.icon} />
      ) : null}
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-medium">
          {location?.fullName ?? entry.battleId}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {t("schedule.battle", {
            number: location?.nodeNumber ?? entry.battleId,
          })}
        </div>
      </div>
      <Badge className="shrink-0 tabular-nums" variant="outline">
        {entry.raidsToPerform === entry.dailyAttempts
          ? t("schedule.maxRaids")
          : t("schedule.raids", { count: entry.raidsToPerform })}
      </Badge>
      <ResourceIconWithTooltip
        className="size-6"
        label={resourceLabel}
        visual={resourceVisual}
      />
    </div>
  )
}
