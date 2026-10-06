import { useState } from "react"
import { Navigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getManifestMetadata,
  getPlayerDataMetadata,
} from "@workspace/player-data"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
  useLegendaryEvent,
  useLegendaryEventCommon,
  useLegendaryEventProgress,
} from "@/entities/legendary-event"
import { useTourPageSteps } from "@/shared/tour"
import { useUnitName } from "@/shared/unit-name"

import { LegendaryEventDesktopPage } from "./legendary-event-desktop-page"
import { LegendaryEventMobilePage } from "./legendary-event-mobile-page"
import {
  buildRunStatusView,
  type LegendaryEventPageViewProps,
} from "./legendary-event-page.view-model"
import { useLegendaryEventTutorial } from "./legendary-event.tutorial"

/** `/events/legendary-events/:eventId`: computes the page's view props once and renders the
 *  desktop or mobile form (design D4). An unknown id replaces the route with the hub. The content
 *  is keyed by the event id, so the mobile lane selection (and every read) starts fresh on each
 *  event instead of carrying over from the previous one. */
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
  // `null` until the first sync: the manifest row carries the sync instant as `updatedAt`.
  const syncedAt = useLiveQuery(async () => {
    const updatedAt = getManifestMetadata(
      await getPlayerDataMetadata()
    )?.updatedAt
    return updatedAt ? Date.parse(updatedAt) : null
  }, [])
  // Mobile-only; defaults to Alpha and lives as long as this event's page does.
  const [selectedLane, setSelectedLane] =
    useState<LegendaryEventLaneId>("alpha")
  useTourPageSteps(useLegendaryEventTutorial())

  if (event.status === "loading") {
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

  const props: LegendaryEventPageViewProps = {
    event: event.data,
    name: unitName("Character", event.data.id),
    lifecycle: event.lifecycle,
    nowMs: event.nowMs,
    runStatus: buildRunStatusView(progress, common),
    syncedAtMs: syncedAt ?? null,
    laneIds: isMobile ? [selectedLane] : LEGENDARY_EVENT_LANE_IDS,
    selectedLane,
    onSelectLane: setSelectedLane,
  }

  return isMobile ? (
    <LegendaryEventMobilePage {...props} />
  ) : (
    <LegendaryEventDesktopPage {...props} />
  )
}
