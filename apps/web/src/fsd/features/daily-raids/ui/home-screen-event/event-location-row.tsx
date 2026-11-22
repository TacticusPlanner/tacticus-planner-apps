import type { ReactNode } from "react"
import type { BattleId } from "@workspace/game-domain"

import type { DailyRaidLocationViewModel } from "../../model/daily-raids.domain"
import { RaidLocationName } from "../raid-location-name"
import type { RaidLocationTarget } from "../raid-location-name"

/**
 * One campaign location on the HSE/HRE lists, as a row under its campaign's header (`CampaignGroup`):
 * the battle ("Battle 36") and trailing badges. A battle the catalog cannot place has no header, so
 * its row shows its raw id instead. A group's only row names its location in full on the same line
 * as its badges, as on Dailies > Raids. With `onShowLocation`, the battle's name opens its enemies.
 * `details` go on a line of their own under the row, so a busy row never squeezes the name.
 */
export function EventLocationRow({
  battleId,
  onShowLocation,
  location,
  fallbackLabel,
  testId,
  children,
  details,
}: {
  battleId?: BattleId
  onShowLocation?: (target: RaidLocationTarget) => void
  location: DailyRaidLocationViewModel | undefined
  /** Shown as the name when the catalog has no view model for the battle. */
  fallbackLabel: string
  testId: string
  children: ReactNode
  /** Badges for a second line under the row (an HRE battle's enemies and count). */
  details?: ReactNode
}) {
  return (
    <li
      className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5"
      data-testid={testId}
    >
      <div className="min-w-20 flex-1">
        <RaidLocationName
          battleId={battleId}
          fallbackLabel={fallbackLabel}
          location={location}
          nodeOnly
          onShow={onShowLocation}
        />
      </div>
      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
        {children}
      </div>
      {details === undefined || details === null ? null : (
        <div
          className="flex basis-full flex-wrap items-center justify-end gap-1.5"
          data-testid={`${testId}-details`}
        >
          {details}
        </div>
      )}
    </li>
  )
}
