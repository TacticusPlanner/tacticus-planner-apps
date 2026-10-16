import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { RunInputsDrawer } from "@/features/legendary-event-run-inputs"
import {
  NextTokenCard,
  RunForecastSection,
  TokenPlanList,
} from "@/features/legendary-event-tokens"

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
 * The event page on both forms (design D3): header, the tab strip, then the Overview tab (Next
 * token, Run status, Token plan, Run forecast, lane summary, cross-lane leaderboard) or a lane tab (lane overview, Teams, synced
 * progress, then the lane's leaderboard). The forms differ only in the strip's stickiness and in the
 * table-versus-cards rendering of the leaderboard and grid.
 */
export function LegendaryEventPageView({
  isMobile,
  ...props
}: LegendaryEventPageViewModel & { isMobile: boolean }) {
  const { t } = useTranslation("legendaryEvents")
  const { selectedTab, tokens } = props
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
          <NextTokenCard
            event={props.event}
            eventId={props.event.id}
            isMobile={isMobile}
            onMarkToken={tokens.onMarkToken}
            onOpenTeams={tokens.onOpenTeams}
            view={tokens.view}
          />
          <RunStatusCard {...props} isMobile={isMobile} />
          <TokenPlanList
            event={props.event}
            eventId={props.event.id}
            isMobile={isMobile}
            view={tokens.view}
          />
          <RunForecastSection
            editInputs={
              props.runInputs.enabled ? (
                <RunInputsDrawer
                  currentRun={props.runInputs.currentRun}
                  event={props.event}
                  isMobile={isMobile}
                  trigger={
                    <Button
                      className="px-0"
                      data-testid="run-forecast-edit-inputs"
                      type="button"
                      variant="link"
                    >
                      {t("tokenPlan.forecast.editInputs")}
                    </Button>
                  }
                />
              ) : null
            }
            eventId={props.event.id}
            isMobile={isMobile}
            onOpenTeams={tokens.onOpenTeams}
            view={tokens.view}
          />
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
            marks={props.marks}
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
