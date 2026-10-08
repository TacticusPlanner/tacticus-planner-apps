import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  currentLegendaryEventRun,
  type LegendaryEventLaneId,
  useLegendaryEvent,
  useLegendaryEventCommon,
  useLegendaryEventProgress,
  useLegendaryEventRoster,
  useLegendaryEventSyncTimes,
  useLegendaryEventUnits,
} from "@/entities/legendary-event"
import { useLegendaryEventPlan } from "@/features/legendary-event-teams"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { LegendaryEventPageView } from "./legendary-event-page-view"
import {
  buildLeaderboardRows,
  buildProgressGridViewModel,
  buildRunStatusViewModel,
  readValue,
  type LegendaryEventPageViewModel,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { useLegendaryEventTutorial } from "./legendary-event.tutorial"
import { progressHeadingId } from "./progress/progress-heading"
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
  const common = useLegendaryEventCommon()
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
  const units = readValue(useLegendaryEventUnits())
  const roster = readValue(useLegendaryEventRoster())
  const progressValue = readValue(progress)
  // Depth writes target the synced run, or run 1 without a synced entry (design D8).
  const run = currentLegendaryEventRun(
    typeof progressValue === "object" ? progressValue : undefined
  )
  const plan = useLegendaryEventPlan({ eventId, run })
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
      common,
      progressObservedAtMs:
        syncTimes.status === "ready"
          ? syncTimes.data.progressObservedAtMs
          : null,
      nowMs: event.nowMs,
    }),
    syncedAtMs:
      syncTimes.status === "ready" ? syncTimes.data.syncedAtMs : undefined,
    selectedTab,
    onSelectTab: selectTab,
    onJumpToLane: jumpToLane,
    leaderboard: {
      ...leaderboardRows,
      onlyUnlocked,
      onOnlyUnlockedChange: setOnlyUnlocked,
      deductScored,
      onDeductScoredChange: setDeductScored,
      selectedObjectives,
      onSelectedObjectivesChange: setSelectedObjectives,
    },
    progressGrid,
    teams: {
      state: buildTeamsSectionState({
        enabled: plan.enabled,
        query: plan.query,
        units,
        roster,
      }),
      run,
      actions: plan,
    },
  }

  return <LegendaryEventPageView {...viewModel} isMobile={isMobile} />
}
