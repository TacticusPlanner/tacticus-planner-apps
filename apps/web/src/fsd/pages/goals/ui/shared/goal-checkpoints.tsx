import { useTranslation } from "react-i18next"
import { Flag } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { formatEstimateDate, useDateLocale } from "@/shared/lib"
import { RankBadge } from "@/shared/ui"

import type { EstimateOutcome } from "@/entities/goal-farming"
import { goalCheckpointsView } from "./goal-checkpoints-view"
import type { CheckpointRow } from "./goal-checkpoints-view"

function CheckpointLabel({ row }: { row: CheckpointRow }) {
  const { t } = useTranslation()
  if (!row.label) return <span>{row.target}</span>
  if (row.label.kind === "Rank") {
    return <RankBadge rank={row.label.rank} />
  }
  return (
    <span>
      {t(`goals.overview.abilityTrack.${row.label.track}`)} {row.label.level}
    </span>
  )
}

/** A staged goal's farming-strategy checkpoints ("Every step", "Milestones", …): a one-line summary
 *  naming the next checkpoint and its date, opening the full list with each checkpoint's date and the
 *  energy it takes on its own. Renders nothing for a goal without checkpoints. */
export function GoalCheckpoints({
  estimate,
  goalType,
}: {
  estimate: EstimateOutcome | undefined
  goalType: string
}) {
  const { t, i18n } = useTranslation()
  const dateLocale = useDateLocale()
  const view = goalCheckpointsView(estimate, goalType)
  if (!view) return null
  const number = new Intl.NumberFormat(i18n.resolvedLanguage)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="mt-1 flex items-center gap-1 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
          data-testid="goal-checkpoints-trigger"
          type="button"
        >
          <Flag aria-hidden="true" className="size-3.5 shrink-0" />
          <span>
            {t("goals.estimate.checkpoints.summary", {
              count: view.rows.length,
            })}
          </span>
          {view.next ? (
            <span className="flex items-center gap-1">
              · {t("goals.estimate.checkpoints.next")}
              <CheckpointLabel row={view.next} />
              {formatEstimateDate(view.next.date, dateLocale)}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="gap-2"
        data-testid="goal-checkpoints"
      >
        <PopoverTitle>{t("goals.estimate.checkpoints.title")}</PopoverTitle>
        {/* Two lines per checkpoint: in the fixed `w-72` popover a third column (the date) left the
            label no width, so a rank badge painted over it. The date sits under the label instead. */}
        <ol className="grid gap-2 text-sm">
          {view.rows.map((row) => (
            <li
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3"
              data-testid="goal-checkpoint"
              key={row.target}
            >
              <span className="grid min-w-0 gap-0.5">
                <CheckpointLabel row={row} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {row.days === 0
                    ? t("goals.estimate.checkpoints.ready")
                    : `${formatEstimateDate(row.date, dateLocale)} · ${t("goals.estimate.days", { days: row.days })}`}
                </span>
              </span>
              <span className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                {t("goals.estimate.checkpoints.energy", {
                  energy: number.format(row.energy),
                })}
              </span>
            </li>
          ))}
        </ol>
      </PopoverContent>
    </Popover>
  )
}
