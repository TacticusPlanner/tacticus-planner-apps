import { useTranslation } from "react-i18next"
import { Check, Circle, Ellipsis } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  type LaneProgressView,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import {
  AnnotationMarkIcon,
  AnnotationMenu,
  BattleAnnotationMenu,
} from "@/features/legendary-event-annotations"

import type { ProgressColumn } from "./progress-columns"
import { progressHeadingId } from "./progress-heading"
import type { LaneMarks } from "./progress-marks"

export function ProgressColumnIcon({ column }: { column: ProgressColumn }) {
  if (!column.icon) return <Circle aria-hidden="true" className="size-4" />
  return <ObjectiveIcon className="size-4" icon={column.icon} />
}

/** A cleared / not-cleared cell: an icon plus "cleared" / "not cleared" text, never colour
 *  alone. */
function ClearedCell({ cleared, label }: { cleared: boolean; label: string }) {
  const { t } = useTranslation("legendaryEvents")
  const text = t(cleared ? "progress.cellCleared" : "progress.cellNotCleared", {
    objective: label,
  })
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        cleared
          ? "bg-(--event-legendary) text-white"
          : "border border-dashed border-muted-foreground/40"
      )}
      data-cleared={cleared}
      data-testid="progress-cell"
      title={text}
    >
      {cleared ? <Check aria-hidden="true" className="size-4" /> : null}
      <span className="sr-only">{text}</span>
    </span>
  )
}

/** One grid cell: a cleared cell (or any cell without marks) is a plain indicator; a not-cleared
 *  cell with marks is the control for its Maybe clear / Stop here mark. */
export function ProgressCell({
  cleared,
  label,
  battleIndex,
  objectiveId,
  marks,
  touch = false,
}: {
  cleared: boolean
  label: string
  battleIndex: number
  objectiveId: number
  marks: LaneMarks | undefined
  touch?: boolean
}) {
  if (cleared || !marks) return <ClearedCell cleared={cleared} label={label} />
  return (
    <AnnotationMenu
      battle={battleIndex + 1}
      objective={label}
      onChange={(status) => marks.onMarkCell(battleIndex, objectiveId, status)}
      status={marks.statusAt(battleIndex, objectiveId)}
      touch={touch}
    />
  )
}

/** The desktop row action of an incomplete battle: a "⋯" button opening the battle's mark menu. */
export function BattleRowAction({
  battle,
  marks,
}: {
  battle: { index: number; cleared: boolean[] }
  marks: LaneMarks
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <BattleAnnotationMenu
      battle={battle.index + 1}
      onChange={(status) => marks.onMarkBattle(battle, status)}
      trigger={
        <Button
          aria-label={t("annotations.rowAction", { battle: battle.index + 1 })}
          data-testid="progress-row-action"
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Ellipsis />
        </Button>
      }
    />
  )
}

/** The marks legend under the section header, beside "how points work". */
export function MarksLegend() {
  const { t } = useTranslation("legendaryEvents")
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border p-3 text-sm"
      data-testid="progress-marks-legend"
    >
      <p className="font-medium">{t("annotations.legend.title")}</p>
      <ul className="flex flex-col gap-1 text-muted-foreground">
        <li className="flex items-start gap-2">
          <AnnotationMarkIcon className="mt-0.5 shrink-0" status="maybeClear" />
          <span>{t("annotations.legend.maybeClear")}</span>
        </li>
        <li className="flex items-start gap-2">
          <AnnotationMarkIcon className="mt-0.5 shrink-0" status="stopHere" />
          <span>{t("annotations.legend.stopHere")}</span>
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        {t("annotations.legend.note")}
      </p>
    </div>
  )
}

/** A lane's header: its name, points earned of the maximum and a progress bar. An earned value
 *  above the maximum is shown as-is and clamped for the bar. */
export function LaneProgressHeader({
  laneId,
  progress,
}: {
  laneId: LegendaryEventLaneId
  progress: LaneProgressView
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const earned = number.format(progress.pointsEarned)
  const max = number.format(progress.maxPoints)
  const percent =
    progress.maxPoints > 0
      ? Math.min(100, (progress.pointsEarned / progress.maxPoints) * 100)
      : 0
  const lane = t(`lanes.${laneId}`)
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        {/* The scroll margin keeps the heading below the mobile header and the sticky tab strip
            when the Overview lane summary scrolls to it. */}
        <h3
          className="scroll-mt-[calc(var(--mobile-header-height)+3rem)] font-semibold md:scroll-mt-4"
          id={progressHeadingId(laneId)}
        >
          {lane}
        </h3>
        <span
          className="text-sm font-medium tabular-nums"
          data-testid="progress-lane-total"
        >
          {t("progress.laneTotal", { earned, max })}
        </span>
      </div>
      <Progress
        aria-label={t("progress.laneTotalLabel", { lane, earned, max })}
        // The shared Progress draws `value` but does not forward it to the Radix root, so the
        // accessible value is set here.
        aria-valuenow={Math.round(percent)}
        data-testid="progress-lane-bar"
        indicatorClassName="bg-(--event-legendary)"
        max={100}
        value={percent}
      />
    </div>
  )
}
