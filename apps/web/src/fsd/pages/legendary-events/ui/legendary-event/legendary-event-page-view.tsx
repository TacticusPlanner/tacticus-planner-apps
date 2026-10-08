import { LaneOverview } from "./lane-overview"
import { LeaderboardSection } from "./leaderboard/leaderboard-section"
import { LegendaryEventHeader } from "./legendary-event-header"
import type { LegendaryEventPageViewModel } from "./legendary-event-page.view-model"
import { LegendaryEventTabs } from "./legendary-event-tabs"
import { CrossLaneLeaderboard } from "./overview/cross-lane-leaderboard"
import { LaneSummary } from "./overview/lane-summary"
import { ProgressSection } from "./progress/progress-section"
import { RunStatusCard } from "./run-status-card"
import { TeamsSection } from "./teams/teams-section"

/**
 * The event page on both forms (design D3): header, the tab strip, then the Overview tab (Run
 * status, lane summary, cross-lane leaderboard) or a lane tab (lane overview, Teams, synced
 * progress, then the lane's leaderboard). The forms differ only in the strip's stickiness and in the
 * table-versus-cards rendering of the leaderboard and grid.
 */
export function LegendaryEventPageView({
  isMobile,
  ...props
}: LegendaryEventPageViewModel & { isMobile: boolean }) {
  const { selectedTab } = props
  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      data-testid="legendary-event-page"
    >
      <LegendaryEventHeader {...props} />
      <LegendaryEventTabs
        isMobile={isMobile}
        onSelectTab={props.onSelectTab}
        selectedTab={selectedTab}
      />
      {selectedTab === "overview" ? (
        <div
          className="flex min-w-0 flex-col gap-6"
          data-testid="legendary-event-overview"
        >
          <RunStatusCard {...props} />
          <LaneSummary
            event={props.event}
            onJumpToLane={props.onJumpToLane}
            progressGrid={props.progressGrid}
          />
          <CrossLaneLeaderboard
            event={props.event}
            layout={isMobile ? "list" : "table"}
            leaderboard={props.leaderboard}
            progressGrid={props.progressGrid}
          />
        </div>
      ) : (
        <div
          className="flex min-w-0 flex-col gap-6"
          data-lane={selectedTab}
          data-testid="legendary-event-lane"
        >
          <LaneOverview event={props.event} laneIds={[selectedTab]} />
          <TeamsSection
            isMobile={isMobile}
            lane={props.event[selectedTab]}
            laneId={selectedTab}
            onlyUnlocked={props.leaderboard.onlyUnlocked}
            teams={props.teams}
          />
          <ProgressSection
            event={props.event}
            laneId={selectedTab}
            layout={isMobile ? "rows" : "grid"}
            progressGrid={props.progressGrid}
          />
          <LeaderboardSection
            event={props.event}
            laneId={selectedTab}
            layout={isMobile ? "list" : "table"}
            leaderboard={props.leaderboard}
            progressGrid={props.progressGrid}
          />
        </div>
      )}
    </div>
  )
}
