import { LaneOverview } from "./lane-overview"
import { LeaderboardSection } from "./leaderboard/leaderboard-section"
import { LegendaryEventHeader } from "./legendary-event-header"
import type { LegendaryEventPageViewModel } from "./legendary-event-page.view-model"
import { ProgressSection } from "./progress/progress-section"
import { RunStatusCard } from "./run-status-card"

/** Desktop form: Run status, then the three lanes of every lane-scoped section (Lane overview,
 *  Eligibility leaderboard, Synced progress), no lane selector. */
export function LegendaryEventDesktopPage(props: LegendaryEventPageViewModel) {
  return (
    <div
      className="flex min-w-0 flex-col gap-6"
      data-testid="legendary-event-page"
    >
      <LegendaryEventHeader {...props} />
      <RunStatusCard {...props} />
      <LaneOverview event={props.event} laneIds={props.laneIds} />
      <LeaderboardSection
        event={props.event}
        laneIds={props.laneIds}
        layout="table"
        leaderboard={props.leaderboard}
      />
      <ProgressSection
        event={props.event}
        laneIds={props.laneIds}
        layout="grid"
        progressGrid={props.progressGrid}
      />
    </div>
  )
}
