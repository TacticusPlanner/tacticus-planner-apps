import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  LEGENDARY_EVENT_LANE_IDS,
  ObjectiveIcon,
  objectiveClearedCounts,
  useObjectiveLabel,
  type LaneProgressView,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventObjective,
} from "@/entities/legendary-event"

import type { ProgressGridViewModel } from "../legendary-event-page.view-model"

/**
 * The Overview lane summary (spec: the Overview tab summarises the event): one activatable row
 * per lane with the lane's earned points of its maximum, a bar, the count of fully cleared
 * battles and one cleared-count indicator per lane objective. Activating a row jumps to that
 * lane's Synced progress grid.
 */
export function LaneSummary({
  event,
  progressGrid,
  onJumpToLane,
}: {
  event: LegendaryEvent
  progressGrid: ProgressGridViewModel
  onJumpToLane: (lane: LegendaryEventLaneId) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <section
      aria-labelledby="legendary-event-lane-summary-title"
      className="flex min-w-0 flex-col gap-3"
      data-testid="legendary-event-lane-summary"
    >
      <h2
        className="text-lg font-semibold"
        id="legendary-event-lane-summary-title"
      >
        {t("laneSummary.title")}
      </h2>
      {progressGrid.kind === "loading" ? (
        <div data-testid="lane-summary-loading">
          <span className="sr-only">{t("hub.loading")}</span>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <Card className="min-w-0 py-2">
          <CardContent className="flex min-w-0 flex-col divide-y px-2">
            {LEGENDARY_EVENT_LANE_IDS.map((laneId) => (
              <LaneSummaryRow
                key={laneId}
                laneId={laneId}
                objectives={event[laneId].unitsRestrictions}
                onJumpToLane={onJumpToLane}
                progress={
                  progressGrid.kind === "ready"
                    ? progressGrid.lanes[laneId]
                    : undefined
                }
              />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function LaneSummaryRow({
  laneId,
  objectives,
  progress,
  onJumpToLane,
}: {
  laneId: LegendaryEventLaneId
  objectives: readonly LegendaryEventObjective[]
  /** `undefined` when the progress read failed. */
  progress: LaneProgressView | undefined
  onJumpToLane: (lane: LegendaryEventLaneId) => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const lane = t(`lanes.${laneId}`)
  const percent =
    progress && progress.maxPoints > 0
      ? Math.min(100, (progress.pointsEarned / progress.maxPoints) * 100)
      : 0
  return (
    <button
      aria-label={t("laneSummary.open", { lane })}
      className="flex min-w-0 items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      data-lane={laneId}
      data-testid="lane-summary-row"
      onClick={() => onJumpToLane(laneId)}
      type="button"
    >
      <span className="w-14 shrink-0 font-semibold">{lane}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {progress ? (
          <>
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span
                className="font-medium tabular-nums"
                data-testid="lane-summary-points"
              >
                {t("progress.laneTotal", {
                  earned: number.format(progress.pointsEarned),
                  max: number.format(progress.maxPoints),
                })}
              </span>
              <span
                className="text-muted-foreground tabular-nums"
                data-testid="lane-summary-battles"
              >
                {progress.status === "noLane"
                  ? t("laneSummary.noLane")
                  : t("laneSummary.battles", {
                      cleared: number.format(progress.completeBattles),
                      total: number.format(progress.battles.length),
                    })}
              </span>
            </span>
            <Progress
              aria-hidden="true"
              data-testid="lane-summary-bar"
              indicatorClassName="bg-(--event-legendary)"
              max={100}
              value={percent}
            />
            <LaneObjectivesLine objectives={objectives} progress={progress} />
          </>
        ) : (
          <span
            className="text-sm text-muted-foreground"
            data-testid="lane-summary-unavailable"
          >
            {t("laneSummary.unavailable")}
          </span>
        )}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </button>
  )
}

/** One cleared-count indicator per lane objective (spec: the Overview lane summary objectives
 *  line): the objective's icon, "cleared / battles" and a bar in the lane accent colour. */
function LaneObjectivesLine({
  objectives,
  progress,
}: {
  objectives: readonly LegendaryEventObjective[]
  progress: LaneProgressView
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const ordered = [...objectives].sort((a, b) => a.index - b.index)
  const counts = objectiveClearedCounts(progress, ordered.length)
  const total = progress.battles.length
  return (
    <span
      aria-label={t("laneSummary.objectives")}
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
      data-testid="lane-summary-objectives"
      role="list"
    >
      {ordered.map((objective, index) => {
        const { label, icon } = objectiveLabel(objective)
        const cleared = counts[index] ?? 0
        const text = t("laneSummary.objectiveCleared", {
          objective: label,
          cleared: number.format(cleared),
          total: number.format(total),
        })
        return (
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground"
            data-objective={objective.index}
            data-testid="lane-summary-objective"
            key={objective.index}
            role="listitem"
            title={text}
          >
            <ObjectiveIcon className="size-4" icon={icon} />
            <span className="sr-only">{text}</span>
            <span aria-hidden="true" className="tabular-nums">
              {number.format(cleared)} / {number.format(total)}
            </span>
            <Progress
              aria-hidden="true"
              className="h-1 w-8"
              data-testid="lane-summary-objective-bar"
              indicatorClassName="bg-(--event-legendary)"
              max={100}
              value={total > 0 ? Math.min(100, (cleared / total) * 100) : 0}
            />
          </span>
        )
      })}
    </span>
  )
}
