import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import {
  materialNeed,
  plannedRaidNeedForEntry,
} from "../model/planned-raid-need"
import { ManualBattleBadge } from "./manual-battle"
import { PlannedRaidNeedBadge } from "./planned-raid-need-badge"
import { RaidLocationName, type RaidLocationTarget } from "./raid-location-name"
import { ResourceIconWithTooltip } from "./resource-icon"
import { ResourceStock } from "./resource-stock"

/**
 * One battle of Today's schedule under its campaign's header: the battle ("Battle 36", opening its
 * enemies), then the upgrade it farms there with what the player holds of it ("owned/target"). With
 * no target to show, the upgrades still needed take the count's place.
 */
export function ScheduleLocationRow({
  entry,
  resourceEntries,
  location,
  onShowLocation,
  label,
  progress,
  visual,
}: {
  entry: RaidBreakdownEntry
  /** Every entry of the row's upgrade, for its need badge. */
  resourceEntries: RaidBreakdownEntry[]
  location: DailyRaidLocationViewModel | undefined
  onShowLocation?: (target: RaidLocationTarget) => void
  label: string
  progress: DailyRaidResourceProgress | undefined
  visual: DailyRaidResourceVisual | undefined
}) {
  const showsProgress = !!progress && progress.target > 0
  return (
    <li
      className="flex items-center gap-2 py-1.5"
      data-testid={`raid-location-${entry.battleId}`}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <RaidLocationName
          battleId={entry.battleId}
          fallbackLabel={entry.battleId}
          location={location}
          nodeOnly
          onShow={onShowLocation}
        />
        {location?.manual ? <ManualBattleBadge /> : null}
        {showsProgress ? null : (
          <PlannedRaidNeedBadge
            compact
            need={plannedRaidNeedForEntry(entry, materialNeed(resourceEntries))}
          />
        )}
      </div>
      <span
        className="flex shrink-0 items-center gap-1"
        data-testid={`raid-upgrade-${entry.goalId}-${entry.resourceId}`}
      >
        <ResourceIconWithTooltip
          className="size-6"
          label={label}
          visual={visual}
        />
        <ResourceStock
          progress={progress}
          testId={`raid-location-${entry.battleId}-stock`}
        />
      </span>
    </li>
  )
}
