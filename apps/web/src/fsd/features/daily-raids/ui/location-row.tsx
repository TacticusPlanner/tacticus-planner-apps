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

/** One flattened battle location, as a row under its campaign's header (`CampaignGroupedList`): the
 * battle ("Battle 36"), planned raid count, and its primary reward — no unit portrait, goal-type
 * icon, or character/goal label (home-raids-widget spec: "one row per location ... without
 * relation to character"). */
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
    <li
      className="flex flex-wrap items-center gap-2 py-1.5"
      data-testid={`home-raid-location-${entry.battleId}`}
    >
      <div className="min-w-20 flex-1">
        <RaidLocationName
          battleId={entry.battleId}
          fallbackLabel={entry.battleId}
          location={location}
          nodeOnly
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
          materialNeed: entry.materialNeed,
          dropRate: entry.dropRate,
        })}
      />
      <ResourceIconWithTooltip
        className="size-8"
        label={resourceLabel}
        visual={resourceVisual}
      />
    </li>
  )
}
