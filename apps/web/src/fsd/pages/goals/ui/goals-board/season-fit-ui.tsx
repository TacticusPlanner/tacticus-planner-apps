import { useTranslation } from "react-i18next"
import { TableCell, TableRow } from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { ActiveSeasonFit } from "@/features/goal-planning"
import {
  seasonCutoffText,
  seasonFitLabel,
  seasonFitTooltip,
} from "./season-fit-copy"

/** The fit label beside a goal's Done By date, nothing for a goal without a fit (goal-season-fit
 *  spec: ineligible goals keep their Done By content unchanged). Same on desktop and mobile. */
export function SeasonFitLabel({
  goalId,
  seasonFit,
}: {
  goalId: string
  seasonFit: ActiveSeasonFit | null | undefined
}) {
  const { t, i18n } = useTranslation()
  const fit = seasonFit?.fits.get(goalId)
  if (!seasonFit || !fit) return null
  return (
    <Tooltip>
      {/* Focusable so the deadline stays reachable by keyboard. */}
      <TooltipTrigger asChild>
        <button
          className="text-xs font-medium text-muted-foreground underline decoration-dotted underline-offset-2"
          data-offset={fit.offset}
          data-testid="goal-season-fit"
          type="button"
        >
          {seasonFitLabel(t, fit)}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {seasonFitTooltip(t, i18n.resolvedLanguage ?? "en", seasonFit, fit)}
      </TooltipContent>
    </Tooltip>
  )
}

function useCutoffText(seasonFit: ActiveSeasonFit) {
  const { t, i18n } = useTranslation()
  return seasonCutoffText(t, i18n.resolvedLanguage ?? "en", seasonFit)
}

/** Desktop season cut-off: a full-width row before the first goal past the season. Not a sortable
 *  item, so drag ids and drop targets are unaffected. */
export function SeasonCutoffRow({
  seasonFit,
  colSpan,
}: {
  seasonFit: ActiveSeasonFit
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

/** Mobile season cut-off: a list item between cards (also in reorder mode). */
export function SeasonCutoffItem({
  seasonFit,
}: {
  seasonFit: ActiveSeasonFit
}) {
  const text = useCutoffText(seasonFit)
  return (
    <li data-testid="goals-season-cutoff">
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
