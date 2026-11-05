import { useCallback, useMemo, type ReactNode } from "react"

import { UpgradeImpactSection } from "@/features/legendary-event-goals"
import {
  PlanNotesCard,
  RunInputsInline,
  RunMissionsQuickInput,
} from "@/features/legendary-event-plan"
import {
  BattleInfoContext,
  NextTokenCard,
  RunForecastSection,
  TokenPlanList,
  type OpenBattleInfo,
  type OpenTeamHandler,
} from "@/features/legendary-event-tokens"
import {
  LEGENDARY_EVENT_LANE_IDS,
  eventUnitChipData,
} from "@/entities/legendary-event"
import { useUnitName } from "@/shared/unit-name"

import { BattleInfoDialog } from "./battles/battle-info-dialog"
import { firstOpenBattleIndex } from "./battles/battle-info-target"
import { BattlesLaneSelect } from "./battles/battles-lane-select"
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
import { rosterMap } from "./teams/teams.view-model"

/** Plan's Token plan opens by default and remembers its own open state. */
const PLAN_TOKEN_PLAN_OPEN_KEY = "legendaryEvents.planTab.tokenPlan.open"

/**
 * The event page on both forms (design D3): header (with the linked projects and the plan wizard
 * button), the tab strip, then one tab: Overview (lane summary, notes), Teams (the Event board,
 * each shown lane's column with its figures, unit table and team cards, then one eligibility
 * leaderboard over the shown lanes, one lane's own when only one is shown), Plan (Run forecast,
 * Token plan, every lane's Upgrade impact, then one lane's Battles picked in its battle row) or the
 * run tab (Next token with the next few, Run status, the synced progress grid of the shown lanes,
 * Last run). Every other lane
 * block follows one lane selection: one lane at a time on mobile, one to three on desktop. A
 * token's battle opens the battle info dialog. The team editor is mounted once here (design D4),
 * so the board, the team cards and the leaderboards open the same instance.
 */
export function LegendaryEventPageView({
  isMobile,
  ...props
}: LegendaryEventPageViewModel & { isMobile: boolean }) {
  const { selectedTab, lanes, tokens } = props
  const shown = lanes.shown
  const unitName = useUnitName()
  const setBattleInfo = props.battleInfo.onChange
  const openBattleInfo = useCallback<OpenBattleInfo>(
    (laneId, battleIndex) => setBattleInfo({ laneId, battleIndex }),
    [setBattleInfo]
  )
  const teamsState = props.teams.state
  const openTeamEditor = props.teamEditor.openTeamEditor
  const openTeam = useCallback<OpenTeamHandler>(
    (laneId, teamId) => {
      if (teamsState.kind !== "ready") return
      const team = teamsState.plan.teams.find((entry) => entry.id === teamId)
      if (team) openTeamEditor({ laneId, team })
    },
    [teamsState, openTeamEditor]
  )
  const syncedRoster = props.eventBoard.roster
  const chipOf = useMemo(() => {
    const rosterById = syncedRoster ? rosterMap(syncedRoster) : undefined
    return (unitId: string) => eventUnitChipData(unitId, rosterById)
  }, [syncedRoster])
  const laneSelector = <LaneSelector isMobile={isMobile} lanes={lanes} />
  const leaderboardLayout = isMobile ? "list" : "table"
  // Before run 1 (or between runs) the next run's missions are the ones to tick.
  const missionRun =
    props.runInputs.runs.currentRun ?? props.runInputs.runs.nextRun
  const missionsInput =
    props.runInputs.enabled && missionRun !== null ? (
      <RunMissionsQuickInput
        event={props.event}
        run={missionRun}
        touch={isMobile}
      />
    ) : undefined
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
            <RunStatusCard
              {...props}
              isMobile={isMobile}
              onGoToRun={
                props.lifecycle.state === "archived"
                  ? undefined
                  : () => props.onSelectTab("run")
              }
            />
            <LaneSummary
              event={props.event}
              onJumpToLane={props.onJumpToLane}
              potentials={props.potentials}
              progressGrid={props.progressGrid}
            />
            {isMobile ? (
              <CrossLaneLeaderboard
                event={props.event}
                layout="list"
                // Every lane's chips show here, so every lane's selection filters.
                leaderboard={{
                  ...props.leaderboard,
                  selectedObjectives: props.allLanesObjectives.selected,
                  onSelectedObjectivesChange: props.allLanesObjectives.onChange,
                }}
                progressGrid={props.progressGrid}
              />
            ) : null}
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
                  onViewBattles={() =>
                    openBattleInfo(
                      laneId,
                      firstOpenBattleIndex(
                        props.progressGrid.kind === "ready"
                          ? props.progressGrid.lanes[laneId]
                          : undefined
                      )
                    )
                  }
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
              runInputs={
                props.runInputs.enabled
                  ? (run) => (
                      <RunInputsInline
                        event={props.event}
                        run={run.run}
                        runs={props.runInputs.runs}
                        touch={isMobile}
                      />
                    )
                  : undefined
              }
              eventId={props.event.id}
              isMobile={isMobile}
              onOpenTeams={tokens.onOpenTeams}
              view={tokens.view}
            />
            {props.upgradeImpact
              ? LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
                  const state = props.upgradeImpact?.byLane[laneId]
                  return state && props.upgradeImpact ? (
                    <UpgradeImpactSection
                      eventId={props.event.id}
                      goalTargets={props.upgradeImpact.goalTargets}
                      key={laneId}
                      laneId={laneId}
                      layout={leaderboardLayout}
                      nameOf={(unitId) => unitName("Character", unitId)}
                      showLane
                      state={state}
                      teamName={props.upgradeImpact.teamName}
                    />
                  ) : null
                })
              : null}
            <TokenPlanList
              defaultOpen
              event={props.event}
              eventId={props.event.id}
              isMobile={isMobile}
              onOpenTeam={teamsState.kind === "ready" ? openTeam : undefined}
              openKey={PLAN_TOKEN_PLAN_OPEN_KEY}
              view={tokens.view}
            />
            {props.battles[props.battlesLane.laneId] ? (
              <BattlesSection
                battles={props.battles[props.battlesLane.laneId]!}
                isMobile={isMobile}
                laneId={props.battlesLane.laneId}
                lanePicker={
                  <BattlesLaneSelect
                    isMobile={isMobile}
                    laneId={props.battlesLane.laneId}
                    onChange={props.battlesLane.onChange}
                  />
                }
              />
            ) : null}
          </TabPanel>
        ) : null}
        {selectedTab === "run" ? (
          <TabPanel tab="run">
            <NextTokenCard
              chipOf={chipOf}
              event={props.event}
              eventId={props.event.id}
              isMobile={isMobile}
              onMarkToken={tokens.onMarkToken}
              onOpenTeams={tokens.onOpenTeams}
              missionsInput={missionsInput}
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
          event={props.event}
          onChange={setBattleInfo}
          onClose={() => setBattleInfo(null)}
          target={props.battleInfo.target}
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
