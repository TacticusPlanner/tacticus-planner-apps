import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LaneProgressView,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type { ProgressGridViewModel } from "../legendary-event-page.view-model"

/**
 * The Overview lane summary (spec: the Overview tab summarises the event): one activatable row
 * per lane with the lane's earned points of its maximum, a bar and the count of fully cleared
 * battles. Activating a row jumps to that lane's Synced progress grid.
 */
export function LaneSummary({
  progressGrid,
  onJumpToLane,
}: {
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
  progress,
  onJumpToLane,
}: {
  laneId: LegendaryEventLaneId
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
