import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  type LegendaryEvent,
  type LegendaryEventLaneId,
  useClearEstimateConfig,
  useLegendaryEvent,
  useLegendaryEventBattles,
  useLegendaryEventProgress,
  useLegendaryEventRoster,
  useLegendaryEventSyncTimes,
  useLegendaryEventUnits,
} from "@/entities/legendary-event"
import { useAnnotations } from "@/features/legendary-event-annotations"
import { useLegendaryEventPlan } from "@/features/legendary-event-teams"
import { useTokenPlan } from "@/features/legendary-event-tokens"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"
import { useUnitPowerContext } from "@/shared/unit-power"

import { useBattlesSection } from "./battles/use-battles-section"
import { LegendaryEventPageView } from "./legendary-event-page-view"
import {
  buildClearEstimates,
  buildLeaderboardRows,
  buildProgressGridViewModel,
  buildRewardOutlookViewModel,
  buildRunStatusViewModel,
  readValue,
  type LegendaryEventPageViewModel,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { useLegendaryEventTutorial } from "./legendary-event.tutorial"
import { useLastRun } from "./overview/use-last-run"
import { useCreateGoalFromRow } from "./use-create-goal-from-row"
import { useEventGoals } from "./use-event-goals"
import { useEventRuns } from "./use-event-runs"
import { useImpactTeamName, useUpgradeImpact } from "./use-upgrade-impact"
import { progressHeadingId } from "./progress/progress-heading"
import { buildMarksByLane } from "./progress/progress-marks"
import { useTeamEditorLauncher } from "./teams/team-editor-launcher"
import {
  buildTeamsSectionState,
  pickerGoalsPreview,
} from "./teams/teams.view-model"

/** `/legendary-events/:eventId`: computes the page's view model once and renders the tab-strip
 *  page (design D3). An unknown id replaces the route with the hub. The content is keyed by the
 *  event id, so the selected tab, the leaderboard's filters and toggles (and every read) start
 *  fresh on each event instead of carrying over. */
export function LegendaryEventPage() {
  const { eventId = "" } = useParams()
  return <LegendaryEventPageContent eventId={eventId} key={eventId} />
}

function LegendaryEventPageContent({ eventId }: { eventId: string }) {
  const { t } = useTranslation("legendaryEvents")
  const isMobile = useIsMobile()
  const event = useLegendaryEvent(eventId)
  const progress = useLegendaryEventProgress(eventId)
  const unitName = useUnitName()
  const syncTimes = useLegendaryEventSyncTimes()
  const [selectedTab, setSelectedTab] = useState<LegendaryEventTab>("overview")
  // The lane section the Overview asked to show (the lane summary's progress grid, or a token
  // section's Teams section or team card); consumed by the effect below once that lane's tab has
  // mounted. A ref, not state: it drives a DOM scroll, never a render.
  const jumpTarget = useRef<{
    lane: LegendaryEventLaneId
    find: () => Element | null
  } | null>(null)
  // Shared by the three lanes' leaderboards and the Overview one; discarded when the page unmounts.
  const [onlyUnlocked, setOnlyUnlocked] = useState(false)
  const [deductScored, setDeductScored] = useState(true)
  const [selectedObjectives, setSelectedObjectives] = useState<
    ReadonlySet<string>
  >(() => new Set())
  const unitsRead = useLegendaryEventUnits()
  const units = readValue(unitsRead)
  const roster = readValue(useLegendaryEventRoster())
  const progressValue = readValue(progress)
  // Read once: the clear estimates and the team cards share it, so its tables are built once.
  const unitPowerRead = useUnitPowerContext()
  const clearEstimateConfig = useClearEstimateConfig(unitPowerRead)
  const unitPower = readValue(unitPowerRead)
  const battlesRead = useLegendaryEventBattles(eventId)
  const battles = readValue(battlesRead)
  const syncedEntry =
    typeof progressValue === "object" ? progressValue : undefined
  const eventData = event.status === "ready" ? event.data : undefined
  const runs = useEventRuns(event, syncedEntry, roster)
  const plan = useLegendaryEventPlan({ eventId, run: runs.run })
  const annotations = useAnnotations(eventId)
  const teamEditor = useTeamEditorLauncher()
  const marksByLane = useMemo(
    () => buildMarksByLane(annotations.annotations, syncedEntry),
    [annotations.annotations, syncedEntry]
  )
  const progressGrid = useMemo(
    () =>
      eventData
        ? buildProgressGridViewModel(eventData, progressValue)
        : ({ kind: "loading" } as const),
    [eventData, progressValue]
  )
  const leaderboardRows = useMemo(
    () =>
      eventData
        ? buildLeaderboardRows(eventData, units, roster, progressGrid)
        : ({ kind: "loading" } as const),
    [eventData, units, roster, progressGrid]
  )
  const clearEstimates = useMemo(
    () =>
      eventData
        ? buildClearEstimates({
            event: eventData,
            config: clearEstimateConfig,
            battles,
            roster,
          })
        : ({ kind: "pending" } as const),
    [eventData, clearEstimateConfig, battles, roster]
  )

  // Stage 6: goals. The preview feeds only the leaderboards' ownership, rarity, rank and Clears and
  // the picker; points, team cards, upgrade impact and suggestions stay on the synced roster.
  const { captureEvent } = useAnalyticsActions()
  const [goalsPreview, setGoalsPreview] = useState(false)
  const syncedRoster = Array.isArray(roster) ? roster : undefined
  const {
    byUnit: goalTargetsByUnit,
    availability: previewAvailability,
    initialRarityOf,
    preview,
    goalUnitIds,
    goalLines,
  } = useEventGoals({
    eventData,
    units: Array.isArray(units) ? units : undefined,
    roster: syncedRoster,
    rosterPending: roster === "loading",
  })
  const previewOn =
    goalsPreview && previewAvailability === "ready" && preview !== undefined
  const leaderboardRoster = previewOn ? preview.roster : roster
  const previewLeaderboardRows = useMemo(
    () =>
      eventData && previewOn
        ? buildLeaderboardRows(
            eventData,
            units,
            leaderboardRoster,
            progressGrid
          )
        : undefined,
    [eventData, previewOn, units, leaderboardRoster, progressGrid]
  )
  const previewEstimates = useMemo(
    () =>
      eventData && preview
        ? buildClearEstimates({
            event: eventData,
            config: clearEstimateConfig,
            battles,
            roster: preview.roster,
          })
        : undefined,
    [eventData, preview, clearEstimateConfig, battles]
  )
  const changeGoalsPreview = (
    enabled: boolean,
    surface: "leaderboard" | "picker"
  ) => {
    if (surface === "leaderboard") setGoalsPreview(enabled)
    captureEvent({
      type: "legendary_event_goals_preview_toggled",
      eventId,
      enabled,
      surface,
    })
  }
  const createGoalFromRow = useCreateGoalFromRow(eventId, syncedRoster)
  // Run history (design D6–D9): the previous run's card and each team's last-run clear.
  const runHistory = useLastRun(eventId, event, plan, {
    progress: progressValue,
    roster,
  })
  const selectedLane = selectedTab === "overview" ? undefined : selectedTab
  const upgradeImpact = useUpgradeImpact({
    eventData,
    laneId: selectedLane,
    planEnabled: plan.enabled,
    planData: plan.query.data,
    units: Array.isArray(units) ? units : undefined,
    progressPending: progressValue === "loading",
    clearEstimates,
    run: runs.run,
    progressGrid,
    initialRarityOf,
  })
  const impactTeamName = useImpactTeamName(eventData, plan.query.data)
  const battlesSection = useBattlesSection({
    event: eventData,
    laneId: selectedLane,
    battlesRead,
    progressGrid,
  })
  const progressObservedAtMs =
    syncTimes.status === "ready" ? syncTimes.data.progressObservedAtMs : null
  const tokenPlan = useTokenPlan({
    event: eventData,
    lifecycle: event.lifecycle,
    nowMs: event.nowMs,
    progress: progressValue,
    progressObservedAtMs,
    plan: {
      enabled: plan.enabled,
      status: plan.query.status,
      data: plan.query.data,
    },
    resolution: runs.resolution,
    eventUnit: runs.ownedEventUnit,
    estimates: clearEstimates,
  })
  const selectTab = useCallback((tab: LegendaryEventTab) => {
    setSelectedTab(tab)
  }, [])
  const jumpToLane = useCallback((lane: LegendaryEventLaneId) => {
    // The heading carries the sticky-strip offset as scroll-margin (see progress-parts.tsx).
    jumpTarget.current = {
      lane,
      find: () => document.getElementById(progressHeadingId(lane)),
    }
    setSelectedTab(lane)
  }, [])
  const openTeams = useCallback(
    (lane: LegendaryEventLaneId, teamId?: string) => {
      jumpTarget.current = {
        lane,
        find: () =>
          (teamId
            ? document.querySelector(
                `[data-testid="legendary-event-team-card"][data-team="${CSS.escape(teamId)}"]`
              )
            : null) ??
          document.querySelector('[data-testid="legendary-event-teams"]'),
      }
      setSelectedTab(lane)
    },
    []
  )
  useEffect(() => {
    const target = jumpTarget.current
    if (!target || target.lane !== selectedTab) return
    jumpTarget.current = null
    target.find()?.scrollIntoView({ block: "start" })
  }, [selectedTab])
  useTourPageSteps(useLegendaryEventTutorial(selectTab, runHistory.hasLastRun))

  // Until `lres` has synced an absent event may just not have arrived yet (the catalog init gate
  // renders routes under its overlay), so keep loading instead of bouncing a deep link to the hub.
  const awaitingCatalog =
    event.status === "ready" && !event.data && !event.catalogSynced
  if (event.status === "loading" || awaitingCatalog) {
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="legendary-event-loading"
      >
        <span className="sr-only">{t("hub.loading")}</span>
        <Skeleton className="h-12 w-1/2 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (event.status === "error") {
    return (
      <div
        className="flex flex-col items-start gap-3"
        data-testid="legendary-event-error"
      >
        <p className="text-sm text-destructive">{t("hub.error")}</p>
        <Button onClick={event.retry} variant="outline">
          {t("hub.retry")}
        </Button>
      </div>
    )
  }
  if (!event.data || !event.lifecycle) {
    return <Navigate replace to="/legendary-events" />
  }

  const teamsState = buildTeamsSectionState({
    enabled: plan.enabled,
    query: plan.query,
    units,
    retryUnits: unitsRead.retry,
    roster,
    runPending: progressValue === "loading",
  })
  const { openTeamEditor } = teamEditor
  const viewModel: LegendaryEventPageViewModel = {
    event: event.data,
    name: unitName("Character", event.data.id),
    lifecycle: event.lifecycle,
    nowMs: event.nowMs,
    runStatus: buildRunStatusViewModel({
      progress,
      // A record cached before rewards were served lacks them until the next catalog sync.
      rewards: event.data.rewards as LegendaryEvent["rewards"] | undefined,
      progressObservedAtMs,
      nowMs: event.nowMs,
    }),
    outlook: buildRewardOutlookViewModel({
      rewards: event.data.rewards as LegendaryEvent["rewards"] | undefined,
      progress: progressValue,
      unit: runs.eventUnit,
      resolution: runs.resolution,
      plan: plan.query,
      planEnabled: plan.enabled,
    }),
    runInputs: { enabled: plan.enabled, runs: runs.resolution },
    syncedAtMs:
      syncTimes.status === "ready" ? syncTimes.data.syncedAtMs : undefined,
    selectedTab,
    onSelectTab: selectTab,
    onJumpToLane: jumpToLane,
    leaderboard: {
      ...(previewLeaderboardRows ?? leaderboardRows),
      onlyUnlocked,
      onOnlyUnlockedChange: setOnlyUnlocked,
      deductScored,
      onDeductScoredChange: setDeductScored,
      selectedObjectives,
      onSelectedObjectivesChange: setSelectedObjectives,
      clears: previewOn && previewEstimates ? previewEstimates : clearEstimates,
      onAddToTeam:
        teamsState.kind === "ready"
          ? (unitId, laneId) =>
              openTeamEditor({ laneId, memberUnitIds: [unitId] })
          : undefined,
      goals: {
        previewEnabled: goalsPreview,
        availability: previewAvailability,
        onPreviewChange: (enabled) =>
          changeGoalsPreview(enabled, "leaderboard"),
        previewed: previewOn ? preview.previewed : new Set(),
        badgeLines: goalLines,
        onCreateGoal: createGoalFromRow,
      },
    },
    progressGrid,
    marks: {
      editable: annotations.enabled && plan.query.data !== undefined,
      byLane: marksByLane,
      onMarkCell: (laneId, battleIndex, objectiveId, status) =>
        void annotations.markCell(laneId, battleIndex, objectiveId, status),
      onMarkBattle: (laneId, battle, status) =>
        void annotations.markBattle(laneId, battle, status),
    },
    tokens: {
      view: tokenPlan,
      onMarkToken:
        annotations.enabled && plan.query.data !== undefined
          ? (laneId, battleIndex, objectiveIds, status) =>
              void annotations.markToken(
                laneId,
                battleIndex,
                objectiveIds,
                status
              )
          : undefined,
      onOpenTeams: openTeams,
    },
    teams: {
      state: teamsState,
      run: runs.run,
      actions: plan,
      estimates: clearEstimates,
      unitPower,
      eventId,
      lastRunClears: runHistory.lastRunClears,
      progressByLane:
        progressGrid.kind === "ready" ? progressGrid.lanes : undefined,
      goals: {
        goalLines,
        goalUnitIds,
        pickerPreview: (laneId) =>
          pickerGoalsPreview(laneId, {
            enabled: goalsPreview,
            available: previewAvailability === "ready",
            preview,
            estimates: previewEstimates,
            onToggle: (enabled) => changeGoalsPreview(enabled, "picker"),
          }),
      },
    },
    teamEditor,
    lastRun: runHistory.lastRun,
    upgradeImpact: upgradeImpact
      ? {
          state: upgradeImpact,
          goalTargets: goalTargetsByUnit,
          teamName: impactTeamName,
        }
      : null,
    battles: battlesSection,
  }

  return <LegendaryEventPageView {...viewModel} isMobile={isMobile} />
}
