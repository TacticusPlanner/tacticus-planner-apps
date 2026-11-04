import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { UpgradeImpactSection } from "@/features/legendary-event-goals"
import { PlanNotesCard, RunInputsDrawer } from "@/features/legendary-event-plan"
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
import type {
  LegendaryEventPageViewModel,
  LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { LegendaryEventPlanEntry } from "./legendary-event-plan-entry"
import {
  LegendaryEventLanePicker,
  LegendaryEventTabs,
} from "./legendary-event-tabs"
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
 * button), the tab strip, then one tab, after V1's event tabs: Overview (Next token, Run status,
 * Notes, Last run, lane summary), Teams (the all-lanes Event board), Lanes (one lane's overview,
 * Teams and Upgrade impact), Progress (its synced progress grid), Tokens (Token plan and Run
 * forecast), Battles (its battles) or Leaderboard (cross-lane, or one lane's). Lanes, Progress and
 * Battles share one lane picker; Leaderboard has its own, led by All lanes. The forms differ only
 * in the strip's stickiness and in the table-versus-cards rendering of the leaderboards and grid.
 * The team editor is mounted once here (design D4), so the Teams board, the Teams section and the
 * leaderboards open the same instance.
 */
export function LegendaryEventPageView({
  isMobile,
  ...props
}: LegendaryEventPageViewModel & { isMobile: boolean }) {
  const { t } = useTranslation("legendaryEvents")
  const {
    selectedTab,
    selectedLane: lane,
    leaderboardScope: scope,
    tokens,
  } = props
  const unitName = useUnitName()
  const lanePicker = (
    <LegendaryEventLanePicker onValueChange={props.onSelectLane} value={lane} />
  )
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
        <TabPanel tab="overview">
          <NextTokenCard
            event={props.event}
            eventId={props.event.id}
            isMobile={isMobile}
            onMarkToken={tokens.onMarkToken}
            onOpenTeams={tokens.onOpenTeams}
            view={tokens.view}
          />
          <RunStatusCard {...props} isMobile={isMobile} />
          {props.runInputs.enabled ? (
            <PlanNotesCard eventId={props.event.id} />
          ) : null}
          <LastRunCard
            isMobile={isMobile}
            lastRun={props.lastRun.state}
            loadMore={props.lastRun.loadMore}
            onEarlierEntryToggled={props.lastRun.onEarlierEntryToggled}
            onEarlierExpanded={props.lastRun.onEarlierExpanded}
            onViewed={props.lastRun.onViewed}
          />
          <LaneSummary
            event={props.event}
            onJumpToLane={props.onJumpToLane}
            potentials={props.potentials}
            progressGrid={props.progressGrid}
          />
        </TabPanel>
      ) : null}
      {selectedTab === "teams" ? (
        <TabPanel tab="teams">
          <EventBoard
            catalog={props.eventBoard}
            event={props.event}
            onAddTeam={(laneId, objectiveIndexes, unitId) =>
              props.teamEditor.openTeamEditor({
                laneId,
                memberUnitIds: [unitId],
                objectiveIndexes,
              })
            }
            onOpenLane={props.onOpenLane}
            onOpenTeam={(laneId, team) =>
              props.teamEditor.openTeamEditor({ laneId, team })
            }
            progressGrid={props.progressGrid}
            teams={props.teams.state}
            unitPower={props.teams.unitPower}
          />
        </TabPanel>
      ) : null}
      {selectedTab === "tokens" ? (
        <TabPanel tab="tokens">
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
        </TabPanel>
      ) : null}
      {selectedTab === "leaderboard" ? (
        <TabPanel lane={scope === "all" ? undefined : scope} tab="leaderboard">
          <LegendaryEventLanePicker
            allLanes
            onValueChange={props.onSelectLeaderboardScope}
            value={scope}
          />
          {scope === "all" ? (
            <CrossLaneLeaderboard
              event={props.event}
              layout={isMobile ? "list" : "table"}
              leaderboard={props.leaderboard}
              progressGrid={props.progressGrid}
            />
          ) : (
            <LeaderboardSection
              event={props.event}
              laneId={scope}
              layout={isMobile ? "list" : "table"}
              leaderboard={props.leaderboard}
              progressGrid={props.progressGrid}
            />
          )}
        </TabPanel>
      ) : null}
      {selectedTab === "lanes" ? (
        <TabPanel lane={lane} tab="lanes">
          {lanePicker}
          <LaneOverview
            event={props.event}
            isMobile={isMobile}
            laneIds={[lane]}
            potentials={props.potentials}
          />
          <TeamsSection
            editor={props.teamEditor}
            isMobile={isMobile}
            lane={props.event[lane]}
            laneId={lane}
            teams={props.teams}
          />
          {props.upgradeImpact ? (
            <UpgradeImpactSection
              eventId={props.event.id}
              goalTargets={props.upgradeImpact.goalTargets}
              laneId={lane}
              layout={isMobile ? "list" : "table"}
              nameOf={(unitId) => unitName("Character", unitId)}
              state={props.upgradeImpact.state}
              teamName={props.upgradeImpact.teamName}
            />
          ) : null}
        </TabPanel>
      ) : null}
      {selectedTab === "progress" ? (
        <TabPanel lane={lane} tab="progress">
          {lanePicker}
          <ProgressSection
            event={props.event}
            laneId={lane}
            layout={isMobile ? "rows" : "grid"}
            marks={props.marks}
            progressGrid={props.progressGrid}
          />
        </TabPanel>
      ) : null}
      {selectedTab === "battles" ? (
        <TabPanel lane={lane} tab="battles">
          {lanePicker}
          {props.battles ? (
            <BattlesSection
              battles={props.battles}
              isMobile={isMobile}
              laneId={lane}
            />
          ) : null}
        </TabPanel>
      ) : null}
      <TeamEditorHost
        event={props.event}
        launcher={props.teamEditor}
        onlyUnlocked={props.leaderboard.onlyUnlocked}
        teams={props.teams}
      />
    </div>
  )
}

/** One tab's content column; a lane-scoped tab also carries its lane. The Overview and Lanes
 *  panels keep their earlier test ids. */
function TabPanel({
  tab,
  lane,
  children,
}: {
  tab: LegendaryEventTab
  lane?: string
  children: ReactNode
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-6"
      data-lane={lane}
      data-tab={tab}
      data-testid={
        tab === "overview"
          ? "legendary-event-overview"
          : tab === "lanes"
            ? "legendary-event-lane"
            : `legendary-event-${tab}-tab`
      }
    >
      {children}
    </div>
  )
}
