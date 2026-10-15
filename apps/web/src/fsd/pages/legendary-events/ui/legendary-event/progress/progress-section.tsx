import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  LaneProgressView,
  LegendaryEvent,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type { ProgressGridViewModel } from "../legendary-event-page.view-model"
import { ProgressGrid } from "./progress-grid"
import { useProgressColumns } from "./progress-columns"
import { laneMarks, type ProgressMarksViewModel } from "./progress-marks"
import { LaneProgressHeader, MarksLegend } from "./progress-parts"
import { ProgressRows } from "./progress-rows"

/**
 * The Synced progress section of a lane tab, after the Lane overview and before the leaderboard:
 * points earned of the maximum, then the battles × objectives grid read from the last sync.
 * `layout` picks the desktop grid or the mobile compact rows. With editable `marks` (signed in, plan
 * loaded) not-cleared cells and incomplete rows carry Maybe clear / Stop here marks, and the marks
 * legend sits beside "how points work".
 */
export function ProgressSection({
  event,
  laneId,
  progressGrid,
  layout,
  marks,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  progressGrid: ProgressGridViewModel
  layout: "grid" | "rows"
  marks?: ProgressMarksViewModel
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
      <div className="grid gap-3 md:grid-cols-2 md:items-start">
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
        {marks?.editable ? <MarksLegend /> : null}
      </div>
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
        <ProgressLane
          event={event}
          laneId={laneId}
          layout={layout}
          marks={marks?.editable ? marks : undefined}
          progress={progressGrid.lanes[laneId]}
        />
      )}
    </section>
  )
}

function ProgressLane({
  event,
  laneId,
  progress,
  layout,
  marks,
}: {
  event: LegendaryEvent
  laneId: LegendaryEventLaneId
  progress: LaneProgressView
  layout: "grid" | "rows"
  marks: ProgressMarksViewModel | undefined
}) {
  const { t } = useTranslation("legendaryEvents")
  const columns = useProgressColumns(event[laneId])
  const lane = marks ? laneMarks(marks, laneId) : undefined
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
      <ProgressGrid columns={columns} marks={lane} progress={progress} />
    ) : (
      <ProgressRows columns={columns} marks={lane} progress={progress} />
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
