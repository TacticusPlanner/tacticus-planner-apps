import { useTranslation } from "react-i18next"
import { CalendarClock } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
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
import type { CutoffEdge, GoalFitView } from "./season-fit-copy"
import type { SeasonFitOffset } from "@/features/goal-planning"
import { useDateLocale } from "@/shared/lib"
import { ListDivider } from "@/shared/ui"

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

const CUTOFF_TEST_ID = {
  start: "goals-season-cutoff",
  end: "goals-event-end-cutoff",
} as const satisfies Record<CutoffEdge, string>

function useCutoffText(seasonFit: GoalFitView, edge: CutoffEdge) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  return seasonCutoffText(t, dateLocale, seasonFit, edge)
}

/** The divider's line and icon colour: the fit colour of the goals below it, so the line joins
 *  their row and card accents. Written out in full for Tailwind's scanner. */
const CUTOFF_LINE_CLASS: Record<SeasonFitOffset, string> = {
  0: "bg-(--season-fit-on-track)",
  1: "bg-(--season-fit-caution)",
  2: "bg-(--season-fit-urgent)",
  3: "bg-muted-foreground",
}
const CUTOFF_ICON_CLASS: Record<SeasonFitOffset, string> = {
  0: "text-(--season-fit-on-track)",
  1: "text-(--season-fit-caution)",
  2: "text-(--season-fit-urgent)",
  3: "text-muted-foreground",
}

/** Desktop season cut-off: a full-width row before the first goal past the season. Not a sortable
 *  item, so drag ids and drop targets are unaffected. */
export function SeasonCutoffRow({
  seasonFit,
  goalId,
  colSpan,
  edge = "start",
}: {
  seasonFit: GoalFitView
  /** The first goal below the divider; its fit colours the line. */
  goalId: string
  colSpan: number
  edge?: CutoffEdge
}) {
  const text = useCutoffText(seasonFit, edge)
  return (
    <TableRow
      className="hover:bg-transparent"
      data-testid={CUTOFF_TEST_ID[edge]}
    >
      <TableCell className="py-2" colSpan={colSpan}>
        <SeasonCutoffLine
          offset={goalFitOffset(seasonFit, goalId)}
          text={text}
        />
      </TableCell>
    </TableRow>
  )
}

/** Card-list season cut-off: a list item between cards (also in mobile reorder mode). In the cards grid
 *  it spans every column, so the goal after it starts a new grid row. */
export function SeasonCutoffItem({
  seasonFit,
  goalId,
  edge = "start",
}: {
  seasonFit: GoalFitView
  /** The first goal below the divider; its fit colours the line. */
  goalId: string
  edge?: CutoffEdge
}) {
  const text = useCutoffText(seasonFit, edge)
  return (
    <li className="col-span-full py-1" data-testid={CUTOFF_TEST_ID[edge]}>
      <SeasonCutoffLine offset={goalFitOffset(seasonFit, goalId)} text={text} />
    </li>
  )
}

/** A labelled marker, not a row border: the shared list divider with its label in a chip at the left
 *  edge, where the eye scans the priority numbers and names, and a 2px line in the fit colour. On a
 *  narrow phone the chip's text wraps rather than pushing the list wider. */
function SeasonCutoffLine({
  text,
  offset,
}: {
  text: string
  offset: SeasonFitOffset | undefined
}) {
  const tone = offset ?? 3
  return (
    <ListDivider
      chip
      className="py-0"
      icon={
        <CalendarClock
          aria-hidden="true"
          className={cn("size-4 shrink-0", CUTOFF_ICON_CLASS[tone])}
        />
      }
      label={text}
      lineClassName={cn("h-0.5 rounded-full", CUTOFF_LINE_CLASS[tone])}
      tone="default"
    />
  )
}
