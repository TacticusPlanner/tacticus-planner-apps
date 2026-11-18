import type { ReactNode } from "react"

import { EventTimingLines } from "../shared/event-timing-lines"
import type { LegendaryEventPageViewModel } from "./legendary-event-page.view-model"

/** The row above the event tabs: the run countdown ("Starts in 3 days") on every tab, and
 *  `actions` (the plan entry) at the end, wrapping below on narrow screens. The event's name,
 *  lifecycle and date are in the page header, so this row does not repeat them. */
export function LegendaryEventHeader({
  lifecycle,
  nowMs,
  actions,
}: Pick<LegendaryEventPageViewModel, "lifecycle" | "nowMs"> & {
  actions?: ReactNode
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center justify-between gap-3"
      data-testid="legendary-event-header"
    >
      <EventTimingLines countdownOnly lifecycle={lifecycle} nowMs={nowMs} />
      {actions}
    </div>
  )
}
