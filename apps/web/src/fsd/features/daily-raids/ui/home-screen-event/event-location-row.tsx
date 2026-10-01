import type { ReactNode } from "react"

import { EntityIcon } from "@/shared/ui"

import type { DailyRaidLocationViewModel } from "../../model/daily-raids.domain"

/** One campaign location on the HSE tab: icon, campaign name, tier + node, and trailing badges. */
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
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-2 py-1.5"
      data-testid={testId}
    >
      {location?.icon ? (
        <EntityIcon alt="" className="size-6 shrink-0" src={location.icon} />
      ) : null}
      <div className="min-w-32 flex-1 leading-tight">
        <div className="truncate text-sm font-medium">
          {location?.campaignName ?? fallbackLabel}
        </div>
        {location?.nodeLabel ? (
          <div className="truncate text-xs text-muted-foreground">
            {location.nodeLabel}
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
        {children}
      </div>
    </li>
  )
}
