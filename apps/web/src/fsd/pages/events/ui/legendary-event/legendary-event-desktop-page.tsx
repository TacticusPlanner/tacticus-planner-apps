import { LaneOverview } from "./lane-overview"
import { LegendaryEventHeader } from "./legendary-event-header"
import type { LegendaryEventPageViewProps } from "./legendary-event-page.view-model"
import { RunStatusCard } from "./run-status-card"

/** Desktop form: Run status, then the three lanes side by side, no lane selector. */
export function LegendaryEventDesktopPage(props: LegendaryEventPageViewProps) {
  return (
    <div
      className="flex min-w-0 flex-col gap-6"
      data-testid="legendary-event-page"
    >
      <LegendaryEventHeader {...props} />
      <RunStatusCard {...props} />
      <LaneOverview event={props.event} laneIds={props.laneIds} />
    </div>
  )
}
