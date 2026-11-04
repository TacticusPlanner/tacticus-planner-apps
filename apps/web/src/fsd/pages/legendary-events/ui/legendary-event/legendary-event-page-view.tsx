import { useCallback, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { UpgradeImpactSection } from "@/features/legendary-event-goals"
import { PlanNotesCard, RunInputsDrawer } from "@/features/legendary-event-plan"
import {
  BattleInfoContext,
  NextTokenCard,
  RunForecastSection,
  TokenPlanList,
  type OpenBattleInfo,
} from "@/features/legendary-event-tokens"
import { useUnitName } from "@/shared/unit-name"

import {
  BattleInfoDialog,
  type BattleInfoTarget,
} from "./battles/battle-info-dialog"
import { BattlesSection } from "./battles/battles-section"
import { EstimatesDisclaimer } from "./estimates-disclaimer"
import { HowPointsDisclosure, LaneOverviewFigures } from "./lane-overview"
import { LeaderboardSection } from "./leaderboard/leaderboard-section"
import { LegendaryEventHeader } from "./legendary-event-header"
import type {
  LegendaryEventPageViewModel,
  LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { LegendaryEventPlanEntry } from "./legendary-event-plan-entry"
import { LaneSelector, LegendaryEventTabs } from "./legendary-event-tabs"
import { CrossLaneLeaderboard } from "./overview/cross-lane-leaderboard"
import { EventBoard } from "./overview/event-board"
import { LaneSummary } from "./overview/lane-summary"
import { LastRunCard } from "./overview/last-run-card"
import { ProgressSection } from "./progress/progress-section"
import { RunStatusCard } from "./run-status-card"
import { TeamEditorHost } from "./teams/team-editor-host"
import { TeamsSection } from "./teams/teams-section"

/** Plan's Token plan opens by default and remembers its own open state. */
const PLAN_TOKEN_PLAN_OPEN_KEY = "legendaryEvents.planTab.tokenPlan.open"

/**
 * The event page on both forms (design D3): header (with the linked projects and the plan wizard
 * button), the tab strip, then one tab: Overview (lane summary, notes), Teams (the Event board,
 * each shown lane's column with its figures, unit table and team cards, then one eligibility
 * leaderboard over the shown lanes, one lane's own when only one is shown), Plan (Run forecast,
 * Token plan, then each shown lane's Upgrade impact and Battles) or the run tab (Next token with
 * the next few, Run status, the synced progress grid of the shown lanes, Last run). Every lane
 * block follows one lane selection: one lane at a time on mobile, one to three on desktop. A
 * token's battle opens the battle info dialog. The team editor is mounted once here (design D4),
 * so the board, the team cards and the leaderboards open the same instance.
 */
export function LegendaryEventPageView({
  isMobile,
  ...props
}: LegendaryEventPageViewModel & { isMobile: boolean }) {
  const { t } = useTranslation("legendaryEvents")
  const { selectedTab, lanes, tokens } = props
  const shown = lanes.shown
  const unitName = useUnitName()
  const [battleInfo, setBattleInfo] = useState<BattleInfoTarget | null>(null)
  const openBattleInfo = useCallback<OpenBattleInfo>(
    (laneId, battleIndex) => setBattleInfo({ laneId, battleIndex }),
    []
  )
  const laneSelector = <LaneSelector isMobile={isMobile} lanes={lanes} />
  const leaderboardLayout = isMobile ? "list" : "table"
  return (
    <BattleInfoContext.Provider value={openBattleInfo}>
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
          lifecycle={props.lifecycle.state}
          onSelectTab={props.onSelectTab}
          selectedTab={selectedTab}
        />
        <EstimatesDisclaimer />
        {selectedTab === "overview" ? (
          <TabPanel tab="overview">
            <LaneSummary
              event={props.event}
              onJumpToLane={props.onJumpToLane}
              potentials={props.potentials}
              progressGrid={props.progressGrid}
            />
            {props.runInputs.enabled ? (
              <PlanNotesCard eventId={props.event.id} />
            ) : null}
          </TabPanel>
        ) : null}
        {selectedTab === "teams" ? (
          <TabPanel tab="teams">
            {laneSelector}
            <EventBoard
              catalog={props.eventBoard}
              event={props.event}
              laneFigures={(laneId) => (
                <LaneOverviewFigures
                  isMobile={isMobile}
                  lane={props.event[laneId]}
                  laneId={laneId}
                  potential={props.potentials[laneId]}
                />
              )}
              laneIds={shown}
              laneTeamsSection={(laneId) => (
                <TeamsSection
                  editor={props.teamEditor}
                  isMobile={isMobile}
                  lane={props.event[laneId]}
                  laneId={laneId}
                  teams={props.teams}
                />
              )}
              onAddTeam={(laneId, objectiveIndexes, unitId) =>
                props.teamEditor.openTeamEditor({
                  laneId,
                  memberUnitIds: [unitId],
                  objectiveIndexes,
                })
              }
              progressGrid={props.progressGrid}
              teams={props.teams.state}
              unitPower={props.teams.unitPower}
            />
            <HowPointsDisclosure />
            {shown.length === 1 && shown[0] ? (
              <LeaderboardSection
                event={props.event}
                laneId={shown[0]}
                layout={leaderboardLayout}
                leaderboard={props.leaderboard}
                progressGrid={props.progressGrid}
              />
            ) : (
              <CrossLaneLeaderboard
                event={props.event}
                laneIds={shown}
                layout={leaderboardLayout}
                leaderboard={props.leaderboard}
                progressGrid={props.progressGrid}
              />
            )}
          </TabPanel>
        ) : null}
        {selectedTab === "plan" ? (
          <TabPanel tab="plan">
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
            <TokenPlanList
              defaultOpen
              event={props.event}
              eventId={props.event.id}
              isMobile={isMobile}
              openKey={PLAN_TOKEN_PLAN_OPEN_KEY}
              view={tokens.view}
            />
            {laneSelector}
            {props.upgradeImpact
              ? shown.map((laneId) => {
                  const state = props.upgradeImpact?.byLane[laneId]
                  return state && props.upgradeImpact ? (
                    <UpgradeImpactSection
                      eventId={props.event.id}
                      goalTargets={props.upgradeImpact.goalTargets}
                      key={laneId}
                      laneId={laneId}
                      layout={leaderboardLayout}
                      nameOf={(unitId) => unitName("Character", unitId)}
                      showLane={shown.length > 1}
                      state={state}
                      teamName={props.upgradeImpact.teamName}
                    />
                  ) : null
                })
              : null}
            {shown.map((laneId) => {
              const battles = props.battles[laneId]
              return battles ? (
                <BattlesSection
                  battles={battles}
                  isMobile={isMobile}
                  key={laneId}
                  laneId={laneId}
                  showLane={shown.length > 1}
                />
              ) : null
            })}
          </TabPanel>
        ) : null}
        {selectedTab === "run" ? (
          <TabPanel tab="run">
            <NextTokenCard
              event={props.event}
              eventId={props.event.id}
              isMobile={isMobile}
              onMarkToken={tokens.onMarkToken}
              onOpenTeams={tokens.onOpenTeams}
              onViewPlan={props.onViewPlan}
              view={tokens.view}
            />
            <RunStatusCard {...props} isMobile={isMobile} />
            {laneSelector}
            <ProgressSection
              event={props.event}
              laneIds={shown}
              layout={isMobile ? "rows" : "grid"}
              marks={props.marks}
              progressGrid={props.progressGrid}
            />
            <LastRunCard
              isMobile={isMobile}
              lastRun={props.lastRun.state}
              loadMore={props.lastRun.loadMore}
              onEarlierEntryToggled={props.lastRun.onEarlierEntryToggled}
              onEarlierExpanded={props.lastRun.onEarlierExpanded}
              onViewed={props.lastRun.onViewed}
            />
          </TabPanel>
        ) : null}
        <TeamEditorHost
          event={props.event}
          launcher={props.teamEditor}
          onlyUnlocked={props.leaderboard.onlyUnlocked}
          teams={props.teams}
        />
        <BattleInfoDialog
          battles={props.battles}
          isMobile={isMobile}
          onClose={() => setBattleInfo(null)}
          target={battleInfo}
        />
      </div>
    </BattleInfoContext.Provider>
  )
}

/** One tab's content column. The Overview panel keeps its earlier test id. */
function TabPanel({
  tab,
  children,
}: {
  tab: LegendaryEventTab
  children: ReactNode
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-6"
      data-tab={tab}
      data-testid={
        tab === "overview"
          ? "legendary-event-overview"
          : `legendary-event-${tab}-tab`
      }
    >
      {children}
    </div>
  )
}
