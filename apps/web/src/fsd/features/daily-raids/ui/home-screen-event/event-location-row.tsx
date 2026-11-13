import type { ReactNode } from "react"

import type { DailyRaidLocationViewModel } from "../../model/daily-raids.domain"
import { RaidLocationName } from "../raid-location-name"

/**
 * One campaign location on the HSE/HRE lists, as a row under its campaign's header (`CampaignGroup`):
 * the battle ("Battle 36") and trailing badges. A battle the catalog cannot place has no header, so
 * its row shows its raw id instead.
 */
export function EventLocationRow({
  location,
  fallbackLabel,
  testId,
  children,
}: {
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
          fallbackLabel={fallbackLabel}
          location={location}
          nodeOnly
        />
      </div>
      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
        {children}
      </div>
    </li>
  )
}
