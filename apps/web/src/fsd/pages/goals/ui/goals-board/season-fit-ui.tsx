import { useTranslation } from "react-i18next"
import { TableCell, TableRow } from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  goalFitCopy,
  goalFitOffset,
  isDeadlineFitView,
  seasonCutoffText,
} from "./season-fit-copy"
import type { GoalFitView } from "./season-fit-copy"
import { useDateLocale } from "@/shared/lib"

/** The fit label beside a goal's Done By date, nothing for a goal without a fit (goal-season-fit
 *  spec: ineligible goals keep their Done By content unchanged). Same on desktop and mobile. */
export function SeasonFitLabel({
  goalId,
  seasonFit,
}: {
  goalId: string
  seasonFit: GoalFitView | null | undefined
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const offset = goalFitOffset(seasonFit, goalId)
  const copy = goalFitCopy(seasonFit, goalId, t, dateLocale)
  if (offset === undefined || !copy) return null
  const { label, tooltip } = copy
  return (
    <Tooltip>
      {/* Focusable so the deadline stays reachable by keyboard. */}
      <TooltipTrigger asChild>
        <button
          className="text-xs font-medium text-muted-foreground underline decoration-dotted underline-offset-2"
          data-offset={offset}
          data-testid={
            seasonFit && isDeadlineFitView(seasonFit)
              ? "goal-deadline-fit"
              : "goal-season-fit"
          }
          type="button"
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function useCutoffText(seasonFit: GoalFitView) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  return seasonCutoffText(t, dateLocale, seasonFit)
}

/** Desktop season cut-off: a full-width row before the first goal past the season. Not a sortable
 *  item, so drag ids and drop targets are unaffected. */
export function SeasonCutoffRow({
  seasonFit,
  colSpan,
}: {
  seasonFit: GoalFitView
  colSpan: number
}) {
  const text = useCutoffText(seasonFit)
  return (
    <TableRow
      className="hover:bg-transparent"
      data-testid="goals-season-cutoff"
    >
      <TableCell className="py-1" colSpan={colSpan}>
        <SeasonCutoffLine text={text} />
      </TableCell>
    </TableRow>
  )
}

/** Card-list season cut-off: a list item between cards (also in mobile reorder mode). In the cards grid
 *  it spans every column, so the goal after it starts a new grid row. */
export function SeasonCutoffItem({ seasonFit }: { seasonFit: GoalFitView }) {
  const text = useCutoffText(seasonFit)
  return (
    <li className="col-span-full" data-testid="goals-season-cutoff">
      <SeasonCutoffLine text={text} />
    </li>
  )
}

function SeasonCutoffLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2" role="separator" aria-label={text}>
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground">{text}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
