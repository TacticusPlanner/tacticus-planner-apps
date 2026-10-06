import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import type {
  LaneProgressView,
  LegendaryEvent,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type { ProgressGridViewModel } from "../legendary-event-page.view-model"
import { ProgressGrid } from "./progress-grid"
import { useProgressColumns } from "./progress-columns"
import { LaneProgressHeader } from "./progress-parts"
import { ProgressRows } from "./progress-rows"

/**
 * The Synced progress section, after the leaderboard and lane-scoped like it: per lane, points
 * earned of the maximum, then the battles × objectives grid read from the last sync. `layout`
 * picks the desktop grid or the mobile compact rows.
 */
export function ProgressSection({
  event,
  laneIds,
  progressGrid,
  layout,
}: {
  event: LegendaryEvent
  laneIds: readonly LegendaryEventLaneId[]
  progressGrid: ProgressGridViewModel
  layout: "grid" | "rows"
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <section
      aria-labelledby="legendary-event-progress-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-progress-grid"
    >
      <h2 className="text-lg font-semibold" id="legendary-event-progress-title">
        {t("progress.title")}
      </h2>
      <details
        className="rounded-xl border p-3 text-sm"
        data-testid="progress-how-points"
      >
        <summary className="cursor-pointer font-medium">
          {t("progress.howPoints.title")}
        </summary>
        <p className="mt-2 text-muted-foreground">
          {t("progress.howPoints.body")}
        </p>
      </details>
      {progressGrid.kind === "loading" ? (
        <div data-testid="progress-loading">
          <span className="sr-only">{t("hub.loading")}</span>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : progressGrid.kind === "unavailable" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="progress-unavailable"
        >
          {t("progress.unavailable")}
        </p>
      ) : (
        <div
          className={cn(
            "grid min-w-0 gap-3",
            laneIds.length > 1 && "lg:grid-cols-2 2xl:grid-cols-3"
          )}
        >
          {laneIds.map((laneId) => (
            <ProgressLane
              event={event}
              key={laneId}
              laneId={laneId}
              layout={layout}
              progress={progressGrid.lanes[laneId]}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ProgressLane({
  event,
  laneId,
  progress,
  layout,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  progress: LaneProgressView
  layout: "grid" | "rows"
}) {
  const { t } = useTranslation("legendaryEvents")
  const columns = useProgressColumns(event[laneId])
  const body =
    progress.status === "noEvent" ? (
      <p
        className="text-sm text-muted-foreground"
        data-testid="progress-no-event"
      >
        {t("progress.noEvent")}
      </p>
    ) : progress.status === "noLane" ? (
      <p
        className="text-sm text-muted-foreground"
        data-testid="progress-no-lane"
      >
        {t("progress.noLane")}
      </p>
    ) : layout === "grid" ? (
      <ProgressGrid columns={columns} progress={progress} />
    ) : (
      <ProgressRows columns={columns} progress={progress} />
    )

  return (
    <Card className="min-w-0" data-lane={laneId} data-testid="progress-lane">
      <CardHeader>
        <LaneProgressHeader laneId={laneId} progress={progress} />
      </CardHeader>
      <CardContent className="min-w-0">{body}</CardContent>
    </Card>
  )
}
