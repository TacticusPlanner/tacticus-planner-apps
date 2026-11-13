import type { ReactNode } from "react"
import type { BattleId } from "@workspace/game-domain"

import type { DailyRaidLocationViewModel } from "../../model/daily-raids.domain"
import {
  RaidLocationName,
  type RaidLocationTarget,
} from "../raid-location-name"

/**
 * One campaign location on the HSE/HRE lists, as a row under its campaign's header (`CampaignGroup`):
 * the battle ("Battle 36") and trailing badges. A battle the catalog cannot place has no header, so
 * its row shows its raw id instead. With `onShowLocation`, the battle's name opens its enemies.
 */
export function EventLocationRow({
  battleId,
  onShowLocation,
  location,
  fallbackLabel,
  testId,
  children,
}: {
  battleId?: BattleId
  onShowLocation?: (target: RaidLocationTarget) => void
  location: DailyRaidLocationViewModel | undefined
  /** Shown as the name when the catalog has no view model for the battle. */
  fallbackLabel: string
  testId: string
  children: ReactNode
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
    </li>
  )
}
