import { useTranslation } from "react-i18next"
import { Flag } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { formatEstimateDate, useDateLocale } from "@/shared/lib"
import { RankBadge } from "@/shared/ui"

import type { EstimateOutcome } from "@/features/goal-farming"
import {
  goalCheckpointsView,
  type CheckpointRow,
} from "./goal-checkpoints-view"

function CheckpointLabel({ row }: { row: CheckpointRow }) {
  const { t } = useTranslation()
  if (!row.label) return <span>{row.target}</span>
  if (row.label.kind === "Rank") {
    return <RankBadge iconClassName="size-5" rank={row.label.rank} />
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
  const number = new Intl.NumberFormat(i18n?.resolvedLanguage)

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
        className="w-auto max-w-[calc(100vw-2rem)]"
        data-testid="goal-checkpoints"
      >
        <p className="mb-2 text-sm font-medium">
          {t("goals.estimate.checkpoints.title")}
        </p>
        <ol className="grid gap-1.5 text-sm">
          {view.rows.map((row) => (
            <li
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3"
              data-testid="goal-checkpoint"
              key={row.target}
            >
              <CheckpointLabel row={row} />
              <span className="text-right whitespace-nowrap tabular-nums">
                {row.days === 0
                  ? t("goals.estimate.checkpoints.ready")
                  : `${formatEstimateDate(row.date, dateLocale)} · ${t("goals.estimate.days", { days: row.days })}`}
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
