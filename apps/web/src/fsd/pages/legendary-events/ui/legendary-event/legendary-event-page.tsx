import { useCallback, useMemo, useState } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
  useClearEstimateConfig,
  useLegendaryEvent,
  useLegendaryEventBattles,
  useLegendaryEventProgress,
  useLegendaryEventRoster,
  useLegendaryEventSyncTimes,
  useLegendaryEventUnits,
  useMinuteNow,
} from "@/entities/legendary-event"
import {
  useAnnotations,
  useLegendaryEventPlan,
} from "@/features/legendary-event-plan"
import {
  type MarkTokenHandler,
  useTokenMissionsSource,
  useTokenPlan,
} from "@/features/legendary-event-tokens"
import { usePlanningSettings } from "@/entities/planning-setting"
import { useAnalyticsActions } from "@/shared/analytics"
import { useFeatureFlag } from "@/shared/feature-flags"
import { useSearchParamState } from "@/shared/lib"
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
import { useLaneJump } from "./use-lane-jump"
import { useLanePotentials } from "./use-lane-potentials"
import { useCreateGoalFromRow } from "./use-create-goal-from-row"
import { useEventGoals } from "./use-event-goals"
import { useEventRuns } from "./use-event-runs"
import { useImpactTeamName, useUpgradeImpact } from "./use-upgrade-impact"
import {
  buildMarksByLane,
  type ProgressMarksViewModel,
} from "./progress/progress-marks"
import { useTeamEditorLauncher } from "./teams/team-editor-launcher"
import {
  buildTeamsSectionState,
  pickerGoalsPreview,
} from "./teams/teams.view-model"

const isEventTab = (value: string) =>
  value === "overview" ||
  (LEGENDARY_EVENT_LANE_IDS as readonly string[]).includes(value)

/** `/legendary-events/:eventId`: computes the page's view model once and renders the tab-strip
 *  page (design D3). An unknown id replaces the route with the hub. The selected tab is the `tab`
 *  query parameter (replace history), which navigation to another event does not carry. The
 *  content is keyed by the event id, so the leaderboard's filters and toggles (and every read)
 *  start fresh on each event instead of carrying over. */
export function LegendaryEventPage() {
  const { eventId = "" } = useParams()
  return <LegendaryEventPageContent eventId={eventId} key={eventId} />
}

function LegendaryEventPageContent({ eventId }: { eventId: string }) {
  const { t } = useTranslation("legendaryEvents")
  const isMobile = useIsMobile()
  const event = useLegendaryEvent(eventId)
  // The run status, token plan and timing lines count down, so the page follows every minute.
  const nowMs = useMinuteNow()
  const progress = useLegendaryEventProgress(eventId)
  const unitName = useUnitName()
  const syncTimes = useLegendaryEventSyncTimes()
  const [selectedTab, setSelectedTab] = useSearchParamState<LegendaryEventTab>(
    "tab",
    isEventTab,
    "overview"
  )
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
  const showEventBoard = useFeatureFlag("LreEventBoard")
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
  const changeGoalsPreview = useCallback(
    (enabled: boolean, surface: "leaderboard" | "picker") => {
      if (surface === "leaderboard") setGoalsPreview(enabled)
      captureEvent({
        type: "legendary_event_goals_preview_toggled",
        eventId,
        enabled,
        surface,
      })
    },
    [captureEvent, eventId]
  )
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
  const missionsSource = useTokenMissionsSource(
    eventData,
    Array.isArray(units) ? units : undefined,
    Array.isArray(battles) ? battles : undefined
  )
  const { settings: accountSettings } = usePlanningSettings()
  const tokenPlan = useTokenPlan({
    event: eventData,
    lifecycle: event.lifecycle,
    nowMs,
    progress: progressValue,
    progressObservedAtMs,
    watchAds: accountSettings.watchAds,
    plan: {
      enabled: plan.enabled,
      status: plan.query.status,
      data: plan.query.data,
    },
    resolution: runs.resolution,
    eventUnit: runs.ownedEventUnit,
    estimates: clearEstimates,
    missions: missionsSource,
  })
  const potentials = useLanePotentials(eventData, units, progressGrid, {
    clearEstimates,
    plan: plan.query.data,
    run: runs.run,
  })
  const { selectTab, jumpToLane, openTeams } = useLaneJump(
    selectedTab,
    setSelectedTab
  )
  useTourPageSteps(useLegendaryEventTutorial(selectTab, runHistory.hasLastRun))

  // A record cached before rewards were served lacks them until the next catalog sync.
  const rewards = eventData?.rewards
  const runStatus = useMemo(
    () =>
      buildRunStatusViewModel({
        progress,
        rewards,
        progressObservedAtMs,
        nowMs,
      }),
    [progress, rewards, progressObservedAtMs, nowMs]
  )
  const outlook = useMemo(
    () =>
      buildRewardOutlookViewModel({
        rewards,
        progress: progressValue,
        unit: runs.eventUnit,
        resolution: runs.resolution,
        plan: plan.query,
        planEnabled: plan.enabled,
      }),
    [
      rewards,
      progressValue,
      runs.eventUnit,
      runs.resolution,
      plan.query,
      plan.enabled,
    ]
  )
  const teamsState = useMemo(
    () =>
      buildTeamsSectionState({
        enabled: plan.enabled,
        query: plan.query,
        units,
        retryUnits: unitsRead.retry,
        roster,
        runPending: progressValue === "loading",
      }),
    [plan.enabled, plan.query, units, unitsRead.retry, roster, progressValue]
  )
  const { openTeamEditor } = teamEditor
  const addToTeam = useCallback(
    (unitId: string, laneId: LegendaryEventLaneId) =>
      openTeamEditor({ laneId, memberUnitIds: [unitId] }),
    [openTeamEditor]
  )
  const changeLeaderboardPreview = useCallback(
    (enabled: boolean) => changeGoalsPreview(enabled, "leaderboard"),
    [changeGoalsPreview]
  )
  const { markCell, markBattle, markToken } = annotations
  const markCellVoid = useCallback<ProgressMarksViewModel["onMarkCell"]>(
    (laneId, battleIndex, objectiveId, status) =>
      void markCell(laneId, battleIndex, objectiveId, status),
    [markCell]
  )
  const markBattleVoid = useCallback<ProgressMarksViewModel["onMarkBattle"]>(
    (laneId, battle, status) => void markBattle(laneId, battle, status),
    [markBattle]
  )
  const markTokenVoid = useCallback<MarkTokenHandler>(
    (laneId, battleIndex, objectiveIds, status) =>
      void markToken(laneId, battleIndex, objectiveIds, status),
    [markToken]
  )
  const pickerPreview = useCallback(
    (laneId: LegendaryEventLaneId) =>
      pickerGoalsPreview(laneId, {
        enabled: goalsPreview,
        available: previewAvailability === "ready",
        preview,
        estimates: previewEstimates,
        onToggle: (enabled) => changeGoalsPreview(enabled, "picker"),
      }),
    [
      goalsPreview,
      previewAvailability,
      preview,
      previewEstimates,
      changeGoalsPreview,
    ]
  )
  const marksEditable = annotations.enabled && plan.query.data !== undefined
  const syncedAtMs =
    syncTimes.status === "ready" ? syncTimes.data.syncedAtMs : undefined
  const lifecycle = event.lifecycle
  const viewModel = useMemo((): LegendaryEventPageViewModel | null => {
    if (!eventData || !lifecycle) return null
    return {
      event: eventData,
      name: unitName("Character", eventData.id),
      lifecycle,
      nowMs,
      runStatus,
      outlook,
      runInputs: { enabled: plan.enabled, runs: runs.resolution },
      syncedAtMs,
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
        clears:
          previewOn && previewEstimates ? previewEstimates : clearEstimates,
        onAddToTeam: teamsState.kind === "ready" ? addToTeam : undefined,
        goals: {
          previewEnabled: goalsPreview,
          availability: previewAvailability,
          onPreviewChange: changeLeaderboardPreview,
          previewed: previewOn ? preview.previewed : new Set(),
          badgeLines: goalLines,
          onCreateGoal: createGoalFromRow,
        },
      },
      progressGrid,
      marks: {
        editable: marksEditable,
        byLane: marksByLane,
        onMarkCell: markCellVoid,
        onMarkBattle: markBattleVoid,
      },
      tokens: {
        view: tokenPlan,
        onMarkToken: marksEditable ? markTokenVoid : undefined,
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
        goals: { goalLines, goalUnitIds, pickerPreview },
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
      potentials,
      showEventBoard,
    }
  }, [
    eventData,
    lifecycle,
    unitName,
    nowMs,
    runStatus,
    outlook,
    plan,
    runs.resolution,
    runs.run,
    syncedAtMs,
    selectedTab,
    selectTab,
    jumpToLane,
    previewLeaderboardRows,
    leaderboardRows,
    onlyUnlocked,
    deductScored,
    selectedObjectives,
    previewOn,
    previewEstimates,
    clearEstimates,
    teamsState,
    addToTeam,
    goalsPreview,
    previewAvailability,
    changeLeaderboardPreview,
    preview,
    goalLines,
    createGoalFromRow,
    progressGrid,
    marksEditable,
    marksByLane,
    markCellVoid,
    markBattleVoid,
    tokenPlan,
    markTokenVoid,
    openTeams,
    unitPower,
    eventId,
    runHistory.lastRunClears,
    goalUnitIds,
    pickerPreview,
    teamEditor,
    runHistory.lastRun,
    upgradeImpact,
    goalTargetsByUnit,
    impactTeamName,
    battlesSection,
    potentials,
    showEventBoard,
  ])

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
  if (!viewModel) return <Navigate replace to="/legendary-events" />

  return <LegendaryEventPageView {...viewModel} isMobile={isMobile} />
}
