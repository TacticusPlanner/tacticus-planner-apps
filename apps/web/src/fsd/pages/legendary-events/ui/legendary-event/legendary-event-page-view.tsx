import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { UpgradeImpactSection } from "@/features/legendary-event-goals"
import { RunInputsDrawer } from "@/features/legendary-event-plan"
import {
  NextTokenCard,
  RunForecastSection,
  TokenPlanList,
} from "@/features/legendary-event-tokens"
import { useUnitName } from "@/shared/unit-name"

import { BattlesSection } from "./battles/battles-section"
import { EstimatesDisclaimer } from "./estimates-disclaimer"
import { LaneOverview } from "./lane-overview"
import { LeaderboardSection } from "./leaderboard/leaderboard-section"
import { LegendaryEventHeader } from "./legendary-event-header"
import type { LegendaryEventPageViewModel } from "./legendary-event-page.view-model"
import { LegendaryEventPlanEntry } from "./legendary-event-plan-entry"
import { LegendaryEventTabs } from "./legendary-event-tabs"
import { CrossLaneLeaderboard } from "./overview/cross-lane-leaderboard"
import { EventBoard } from "./overview/event-board"
import { LaneSummary } from "./overview/lane-summary"
import { LastRunCard } from "./overview/last-run-card"
import { ProgressSection } from "./progress/progress-section"
import { RunStatusCard } from "./run-status-card"
import { TeamEditorHost } from "./teams/team-editor-host"
import { TeamsSection } from "./teams/teams-section"

/**
 * The event page on both forms (design D3): header (with the linked projects and the plan wizard
 * button), the tab strip, then the Overview tab (Next token, Run status, Last run, Token plan, Run forecast, lane summary, cross-lane leaderboard) or a lane tab
 * (lane overview, Teams, Upgrade impact, synced progress, Battles, then the lane's leaderboard). The forms
 * differ only in the strip's stickiness and in the table-versus-cards rendering of the leaderboard
 * and grid. The team editor is mounted once here (design D4), so the Teams section and both
 * leaderboards open the same instance.
 */
export function LegendaryEventPageView({
  isMobile,
  ...props
}: LegendaryEventPageViewModel & { isMobile: boolean }) {
  const { t } = useTranslation("legendaryEvents")
  const { selectedTab, tokens } = props
  const unitName = useUnitName()
  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      data-testid="legendary-event-page"
    >
      <LegendaryEventHeader
        {...props}
        actions={
          <LegendaryEventPlanEntry
            eventId={props.event.id}
            showButton={
              props.runInputs.enabled && props.lifecycle.state !== "archived"
            }
            teams={
              props.teams.state.kind === "ready"
                ? props.teams.state.plan.teams
                : undefined
            }
          />
        }
      />
      <LegendaryEventTabs
        isMobile={isMobile}
        onSelectTab={props.onSelectTab}
        selectedTab={selectedTab}
      />
      <EstimatesDisclaimer />
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
          {props.showEventBoard ? (
            <EventBoard
              event={props.event}
              onOpenLane={props.onSelectTab}
              onOpenTeam={(laneId, team) =>
                props.teamEditor.openTeamEditor({ laneId, team })
              }
              progressGrid={props.progressGrid}
              teams={props.teams.state}
            />
          ) : null}
          <LastRunCard
            isMobile={isMobile}
            lastRun={props.lastRun.state}
            loadMore={props.lastRun.loadMore}
            onEarlierEntryToggled={props.lastRun.onEarlierEntryToggled}
            onEarlierExpanded={props.lastRun.onEarlierExpanded}
            onViewed={props.lastRun.onViewed}
          />
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
                  runs={props.runInputs.runs}
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
            potentials={props.potentials}
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
          <LaneOverview
            event={props.event}
            isMobile={isMobile}
            laneIds={[selectedTab]}
            potentials={props.potentials}
          />
          <TeamsSection
            editor={props.teamEditor}
            isMobile={isMobile}
            lane={props.event[selectedTab]}
            laneId={selectedTab}
            teams={props.teams}
          />
          {props.upgradeImpact ? (
            <UpgradeImpactSection
              eventId={props.event.id}
              goalTargets={props.upgradeImpact.goalTargets}
              laneId={selectedTab}
              layout={isMobile ? "list" : "table"}
              nameOf={(unitId) => unitName("Character", unitId)}
              state={props.upgradeImpact.state}
              teamName={props.upgradeImpact.teamName}
            />
          ) : null}
          <ProgressSection
            event={props.event}
            laneId={selectedTab}
            layout={isMobile ? "rows" : "grid"}
            marks={props.marks}
            progressGrid={props.progressGrid}
          />
          {props.battles ? (
            <BattlesSection
              battles={props.battles}
              isMobile={isMobile}
              laneId={selectedTab}
            />
          ) : null}
          <LeaderboardSection
            event={props.event}
            laneId={selectedTab}
            layout={isMobile ? "list" : "table"}
            leaderboard={props.leaderboard}
            progressGrid={props.progressGrid}
          />
        </div>
      )}
      <TeamEditorHost
        event={props.event}
        launcher={props.teamEditor}
        onlyUnlocked={props.leaderboard.onlyUnlocked}
        teams={props.teams}
      />
    </div>
  )
}
