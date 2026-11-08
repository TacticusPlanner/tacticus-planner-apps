import { EntityIcon } from "@/shared/ui"

import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import type { FlattenedRaidLocation } from "../model/flatten-today-locations"
import { plannedRaidNeed } from "../model/planned-raid-need"
import { ManualBattleBadge } from "./manual-battle"
import { PlannedRaidNeedBadge } from "./planned-raid-need-badge"
import { RaidLocationName, type RaidLocationTarget } from "./raid-location-name"
import { ResourceIconWithTooltip } from "./resource-icon"

/** One flattened battle location: compact location chip, planned raid count, and its primary
 * reward — no unit portrait, goal-type icon, or character/goal label (home-raids-widget spec:
 * "one row per location ... without relation to character"). */
export function LocationRow({
  entry,
  location,
  onShowLocation,
  resourceLabel,
  resourceVisual,
}: {
  entry: FlattenedRaidLocation
  location: DailyRaidLocationViewModel | undefined
  /** Makes the location's name open its battle and enemies. */
  onShowLocation?: (target: RaidLocationTarget) => void
  resourceLabel: string
  resourceVisual: DailyRaidResourceVisual | undefined
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border p-2"
      data-testid={`home-raid-location-${entry.battleId}`}
    >
      {location?.icon ? (
        <EntityIcon alt="" className="size-10 shrink-0" src={location.icon} />
      ) : null}
      <div className="min-w-24 flex-1">
        <RaidLocationName
          battleId={entry.battleId}
          fallbackLabel={entry.battleId}
          location={location}
          onShow={onShowLocation}
        />
      </div>
      {location?.manual ? <ManualBattleBadge /> : null}
      <PlannedRaidNeedBadge
        compact
        need={plannedRaidNeed({
          resourceId: entry.resourceId,
          raidsPerformed: entry.raidsToPerform,
          dailyAttempts: entry.dailyAttempts,
          remainingBefore: entry.remainingBefore,
          dropRate: entry.dropRate,
        })}
      />
      <ResourceIconWithTooltip
        className="size-10"
        label={resourceLabel}
        visual={resourceVisual}
      />
    </div>
  )
}
