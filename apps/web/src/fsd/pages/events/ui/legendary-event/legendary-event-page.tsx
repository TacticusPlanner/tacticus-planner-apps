import { useMemo, useState } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  DEFAULT_LEADERBOARD_SORT,
  LEGENDARY_EVENT_LANE_IDS,
  type LeaderboardSort,
  type LegendaryEventLaneId,
  useLegendaryEvent,
  useLegendaryEventCommon,
  useLegendaryEventProgress,
  useLegendaryEventRoster,
  useLegendaryEventSyncTimes,
  useLegendaryEventUnits,
} from "@/entities/legendary-event"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { LegendaryEventDesktopPage } from "./legendary-event-desktop-page"
import { LegendaryEventMobilePage } from "./legendary-event-mobile-page"
import {
  buildLeaderboardRows,
  buildProgressGridViewModel,
  buildRunStatusViewModel,
  readValue,
  type LegendaryEventPageViewModel,
} from "./legendary-event-page.view-model"
import { useLegendaryEventTutorial } from "./legendary-event.tutorial"

/** `/events/legendary-events/:eventId`: computes the page's view model once and renders the
 *  desktop or mobile form (design D4). An unknown id replaces the route with the hub. The content
 *  is keyed by the event id, so the mobile lane selection, the leaderboard's sort and "Only
 *  unlocked" state (and every read) start fresh on each event instead of carrying over. */
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
  // Mobile-only; defaults to Alpha and lives as long as this event's page does.
  const [selectedLane, setSelectedLane] =
    useState<LegendaryEventLaneId>("alpha")
  // Shared by the three lanes' leaderboards; discarded when the page unmounts.
  const [leaderboardSort, setLeaderboardSort] = useState<LeaderboardSort>(
    DEFAULT_LEADERBOARD_SORT
  )
  const [onlyUnlocked, setOnlyUnlocked] = useState(false)
  const units = readValue(useLegendaryEventUnits())
  const roster = readValue(useLegendaryEventRoster())
  const progressValue = readValue(progress)
  const eventData = event.status === "ready" ? event.data : undefined
  const leaderboardRows = useMemo(
    () =>
      eventData
        ? buildLeaderboardRows(eventData, units, roster)
        : ({ kind: "loading" } as const),
    [eventData, units, roster]
  )
  const progressGrid = useMemo(
    () =>
      eventData
        ? buildProgressGridViewModel(eventData, progressValue)
        : ({ kind: "loading" } as const),
    [eventData, progressValue]
  )
  useTourPageSteps(useLegendaryEventTutorial())

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
    return <Navigate replace to="/events/legendary-events" />
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
    laneIds: isMobile ? [selectedLane] : LEGENDARY_EVENT_LANE_IDS,
    selectedLane,
    onSelectLane: setSelectedLane,
    leaderboard: {
      ...leaderboardRows,
      sort: leaderboardSort,
      onSortChange: setLeaderboardSort,
      onlyUnlocked,
      onOnlyUnlockedChange: setOnlyUnlocked,
    },
    progressGrid,
  }

  return isMobile ? (
    <LegendaryEventMobilePage {...viewModel} />
  ) : (
    <LegendaryEventDesktopPage {...viewModel} />
  )
}
