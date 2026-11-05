import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"

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
 * The run tab's Synced progress section, one card per shown lane in lane order: points earned of
 * the maximum, then the battles × objectives grid read from the last sync.
 * `layout` picks the desktop grid or the mobile compact rows. With editable `marks` (signed in, plan
 * loaded) not-cleared cells and incomplete rows carry Maybe clear / Stop here marks, and the marks
 * legend sits beside "how points work". On the mobile rows the marks wait behind an Edit marks
 * switch (off on open), so scrolling past the grid can't open a mark menu.
 */
export function ProgressSection({
  event,
  laneIds,
  progressGrid,
  layout,
  marks,
}: {
  event: LegendaryEvent
  laneIds: readonly LegendaryEventLaneId[]
  progressGrid: ProgressGridViewModel
  layout: "grid" | "rows"
  marks?: ProgressMarksViewModel
}) {
  const { t } = useTranslation("legendaryEvents")
  const switchId = useId()
  const [editing, setEditing] = useState(false)
  const editable = marks?.editable === true
  const needsToggle = editable && layout === "rows"
  const laneMarksOn = editable && (!needsToggle || editing)
  return (
    <section
      aria-labelledby="legendary-event-progress-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-progress-grid"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          className="text-lg font-semibold"
          id="legendary-event-progress-title"
        >
          {t("progress.title")}
        </h2>
        {needsToggle ? (
          <label
            className="flex min-h-10 items-center gap-2 text-sm"
            htmlFor={switchId}
          >
            {t("progress.editMarks")}
            <Switch
              checked={editing}
              data-testid="progress-edit-toggle"
              id={switchId}
              onCheckedChange={setEditing}
            />
          </label>
        ) : null}
      </div>
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
        {laneMarksOn ? <MarksLegend /> : null}
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
        laneIds.map((laneId) => (
          <ProgressLane
            event={event}
            key={laneId}
            laneId={laneId}
            layout={layout}
            marks={laneMarksOn ? marks : undefined}
            progress={progressGrid.lanes[laneId]}
          />
        ))
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
