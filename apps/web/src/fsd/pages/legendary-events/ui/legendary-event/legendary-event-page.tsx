import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useCreateGoalLauncher } from "@/entities/goal"
import {
  buildLanePointsModel,
  currentLegendaryEventRun,
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
import {
  buildUpgradeImpactState,
  leaderboardRowPrefill,
  prefillGoalType,
} from "@/features/legendary-event-goals"
import {
  laneTeams,
  useLegendaryEventPlan,
} from "@/features/legendary-event-teams"
import { useAnalyticsActions } from "@/shared/analytics"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { LegendaryEventPageView } from "./legendary-event-page-view"
import {
  buildClearEstimates,
  buildLeaderboardRows,
  buildProgressGridViewModel,
  buildRewardOutlookViewModel,
  buildRunStatusViewModel,
  laneEstimateInputs,
  readValue,
  type LegendaryEventPageViewModel,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { useLegendaryEventTutorial } from "./legendary-event.tutorial"
import { useEventGoals } from "./use-event-goals"
import { progressHeadingId } from "./progress/progress-heading"
import { buildMarksByLane } from "./progress/progress-marks"
import { buildTeamsSectionState } from "./teams/teams.view-model"

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
  // The lane whose progress grid the Overview lane summary asked to show; consumed by the effect
  // below once that lane's tab has mounted. A ref, not state: it drives a DOM scroll, never a render.
  const jumpTarget = useRef<LegendaryEventLaneId | null>(null)
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
  const clearEstimateConfig = useClearEstimateConfig()
  const battles = readValue(useLegendaryEventBattles(eventId))
  // Depth writes target the synced run, or run 1 without a synced entry (design D8). The Teams
  // section stays loading until the progress resolves, so nothing captures the default meanwhile.
  const run = currentLegendaryEventRun(
    typeof progressValue === "object" ? progressValue : undefined
  )
  const plan = useLegendaryEventPlan({ eventId, run })
  const annotations = useAnnotations(eventId)
  const syncedEntry =
    typeof progressValue === "object" ? progressValue : undefined
  const marksByLane = useMemo(
    () => buildMarksByLane(annotations.annotations, syncedEntry),
    [annotations.annotations, syncedEntry]
  )
  const eventData = event.status === "ready" ? event.data : undefined
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
  const launchCreateGoal = useCreateGoalLauncher()
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
  const createGoalFromRow = (
    unitId: string,
    laneId: LegendaryEventLaneId | null
  ) => {
    const ownership = syncedRoster
      ? syncedRoster.some((unit) => unit.unitId === unitId)
        ? "owned"
        : "locked"
      : "unknown"
    const prefill = leaderboardRowPrefill(unitId, ownership)
    captureEvent({
      type: "legendary_event_create_goal_opened",
      eventId,
      laneId,
      source: "leaderboard",
      goalType: prefillGoalType(prefill),
    })
    launchCreateGoal(prefill)
  }
  const selectedLane = selectedTab === "overview" ? undefined : selectedTab
  const upgradeImpact = useMemo(() => {
    if (!eventData || !selectedLane || !plan.enabled) return null
    const lane = eventData[selectedLane]
    const teamsReady =
      plan.query.data !== undefined &&
      Array.isArray(units) &&
      progressValue !== "loading"
    return buildUpgradeImpactState({
      teams:
        teamsReady && plan.query.data
          ? laneTeams(plan.query.data, selectedLane)
          : "loading",
      estimates: laneEstimateInputs(clearEstimates, selectedLane),
      lane,
      units: Array.isArray(units) ? units : [],
      run,
      model: buildLanePointsModel(lane),
      progress:
        progressGrid.kind === "ready"
          ? progressGrid.lanes[selectedLane]
          : undefined,
      initialRarityOf,
      nameOf: (unitId) => unitName("Character", unitId),
    })
    // `unitName` reads the settled catalog; the rest are the page's memoised reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eventData,
    selectedLane,
    plan.enabled,
    plan.query.data,
    units,
    progressValue,
    clearEstimates,
    run,
    progressGrid,
    initialRarityOf,
  ])
  const selectTab = useCallback((tab: LegendaryEventTab) => {
    setSelectedTab(tab)
  }, [])
  const jumpToLane = useCallback((lane: LegendaryEventLaneId) => {
    jumpTarget.current = lane
    setSelectedTab(lane)
  }, [])
  useEffect(() => {
    const target = jumpTarget.current
    if (!target || target !== selectedTab) return
    jumpTarget.current = null
    // The heading carries the sticky-strip offset as scroll-margin (see progress-parts.tsx).
    document
      .getElementById(progressHeadingId(target))
      ?.scrollIntoView({ block: "start" })
  }, [selectedTab])
  useTourPageSteps(useLegendaryEventTutorial(selectTab))

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

  const viewModel: LegendaryEventPageViewModel = {
    event: event.data,
    name: unitName("Character", event.data.id),
    lifecycle: event.lifecycle,
    nowMs: event.nowMs,
    runStatus: buildRunStatusViewModel({
      progress,
      // A record cached before rewards were served lacks them until the next catalog sync.
      rewards: event.data.rewards as LegendaryEvent["rewards"] | undefined,
      progressObservedAtMs:
        syncTimes.status === "ready"
          ? syncTimes.data.progressObservedAtMs
          : null,
      nowMs: event.nowMs,
    }),
    outlook: buildRewardOutlookViewModel({
      rewards: event.data.rewards as LegendaryEvent["rewards"] | undefined,
      progress: progressValue,
      plan: plan.query,
      planEnabled: plan.enabled,
    }),
    runInputs: { enabled: plan.enabled, currentRun: run },
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
    teams: {
      state: buildTeamsSectionState({
        enabled: plan.enabled,
        query: plan.query,
        units,
        retryUnits: unitsRead.retry,
        roster,
        runPending: progressValue === "loading",
      }),
      run,
      actions: plan,
      estimates: clearEstimates,
      eventId,
      progressByLane:
        progressGrid.kind === "ready" ? progressGrid.lanes : undefined,
      goals: {
        goalLines,
        goalUnitIds,
        pickerPreview: (laneId) => {
          const estimator =
            previewEstimates?.kind === "ready"
              ? previewEstimates.byLane[laneId]
              : undefined
          return {
            enabled: goalsPreview,
            available: previewAvailability === "ready" && preview !== undefined,
            roster: preview?.roster,
            previewed: preview?.previewed ?? new Set(),
            clearsOf: estimator
              ? (unitId) => estimator.unit(unitId)?.depth ?? null
              : undefined,
            onToggle: (enabled) => changeGoalsPreview(enabled, "picker"),
          }
        },
      },
    },
    upgradeImpact: upgradeImpact
      ? {
          state: upgradeImpact,
          goalTargets: goalTargetsByUnit,
          teamName: (teamId) =>
            plan.query.data?.teams.find((team) => team.id === teamId)?.name ??
            teamId,
        }
      : null,
  }

  return <LegendaryEventPageView {...viewModel} isMobile={isMobile} />
}
