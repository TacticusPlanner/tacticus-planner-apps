import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import type { FlattenedRaidLocation } from "../model/flatten-today-locations"
import { plannedRaidNeed } from "../model/planned-raid-need"
import { ManualBattleBadge } from "./manual-battle"
import { PlannedRaidNeedBadge } from "./planned-raid-need-badge"
import { RaidLocationName, type RaidLocationTarget } from "./raid-location-name"
import { ResourceIconWithTooltip } from "./resource-icon"
import { ResourceStock } from "./resource-stock"

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
  progress,
}: {
  entry: FlattenedRaidLocation
  location: DailyRaidLocationViewModel | undefined
  /** Makes the location's name open its battle and enemies. */
  onShowLocation?: (target: RaidLocationTarget) => void
  resourceLabel: string
  resourceVisual: DailyRaidResourceVisual | undefined
  /** What the player holds of the reward against its target over the goals ("X/Y"). */
  progress?: DailyRaidResourceProgress
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
      <span className="flex shrink-0 items-center gap-1">
        <ResourceIconWithTooltip
          className="size-8"
          label={resourceLabel}
          visual={resourceVisual}
        />
        <ResourceStock
          progress={progress}
          testId={`home-raid-location-${entry.battleId}-stock`}
        />
      </span>
    </li>
  )
}
