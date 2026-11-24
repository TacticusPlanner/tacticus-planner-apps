import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Calendar, Hourglass } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { formatEstimateDate, useDateLocale } from "@/shared/lib"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { HintTrigger } from "@/shared/ui"

import { goalRaidDuration } from "@/entities/goal-farming"
import type { EstimateOutcome } from "@/entities/goal-farming"
import type { GoalRow } from "@/features/goal-planning"
import { useGoalCatalog } from "@/features/goal-planning"
import { isInFlightStatus } from "./goal-row-utils"

/** A goal's days of raids once it starts getting energy (`goalRaidDuration`): the table's Duration
 *  column, and an hourglass on the card's date line, whose tooltip says what the figure means. A goal
 *  with no raids shows a dash in the column and nothing on the card. */
export function GoalDuration({
  estimate,
  icon = false,
}: {
  estimate: EstimateOutcome | undefined
  /** The card's date line: an hourglass and a tooltip stand in for the table's column header. */
  icon?: boolean
}) {
  const { t } = useTranslation()
  const duration = goalRaidDuration(estimate)
  if (duration === undefined) {
    // The column keeps a dash so a goal with no raids doesn't read as still loading.
    return icon ? null : (
      <span
        className="text-sm text-muted-foreground"
        data-testid="goal-duration-none"
      >
        -
      </span>
    )
  }
  const text = t("goals.estimate.duration", { count: duration })
  if (!icon) {
    return (
      <span
        className="text-sm whitespace-nowrap tabular-nums"
        data-testid="goal-duration"
      >
        {text}
      </span>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={t("goals.estimate.durationLabel", { count: duration })}
          className="inline-flex cursor-default items-center gap-1 rounded-sm whitespace-nowrap tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          data-testid="goal-duration"
          type="button"
        >
          <Hourglass aria-hidden="true" className="size-3.5 shrink-0" />
          {text}
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("goals.columns.durationHelp")}</TooltipContent>
    </Tooltip>
  )
}

/** The formatted completion date + "in {{days}} days" caption for a computed estimate, nothing when
 * there's no entry for this goal (no project selected, non-Rank goal type) or the farm is blocked —
 * `BlockedIndicator` (rendered alongside `StatusBadge` in the same cell/card) already surfaces that
 * state, with a tooltip naming the specific reason; repeating a second "Blocked" label here duplicated
 * it. The desktop table's own Done by column stacks the date over the day count (`stacked`); the
 * mobile card header keeps the one-line caption. */
export function EstimateCell({
  estimate,
  stacked = false,
}: {
  estimate: EstimateOutcome | undefined
  /** Date on its own line above the day count (the desktop table's dedicated Done by column). */
  stacked?: boolean
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  if (!estimate) return null
  // A Blocked estimate has no date; its reasons and materials live in the Blocked badge's tooltip.
  if (estimate.status === "Blocked") return null
  // Shared with the project surfaces, which render the same date from the features layer and so
  // cannot import it from here — see `shared/lib/format-time/format-estimate-date`, which also documents the
  // UTC parsing this value needs.
  const formattedDate = formatEstimateDate(estimate.date, dateLocale)
  // The short date's tooltip: the same day with its weekday and year.
  const fullDate = formatEstimateDate(estimate.date, dateLocale, "full")
  const dateFace = (content: ReactNode) =>
    fullDate ? (
      <HintTrigger className="gap-1.5" label={fullDate}>
        {content}
      </HintTrigger>
    ) : (
      content
    )
  const days = t("goals.estimate.days", { days: estimate.days })
  if (stacked) {
    // Desktop "Done by" column: the date is the row's headline figure, the day count sits beneath.
    return (
      <span
        className="grid gap-0.5 whitespace-nowrap"
        data-testid="goal-row-estimate"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {dateFace(
            <>
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              {formattedDate}
            </>
          )}
        </span>
        <span className="text-xs text-muted-foreground">{days}</span>
      </span>
    )
  }
  // Each part keeps to one line; on a narrow card the duration wraps under the date as a whole.
  return (
    <span
      className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-muted-foreground"
      data-testid="goal-row-estimate"
    >
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        {dateFace(
          <>
            <Calendar className="size-3.5 shrink-0" />
            <span className="font-medium text-foreground">{formattedDate}</span>
          </>
        )}{" "}
        · {days}
      </span>
      {goalRaidDuration(estimate) === undefined ? null : (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          {" · "}
          <GoalDuration estimate={estimate} icon />
        </span>
      )}
    </span>
  )
}

/** The "-" a Reached row/card shows in place of its progress, remaining and "Done by" content. */
export function ReachedDash() {
  return (
    <span
      className="text-sm text-muted-foreground"
      data-testid="goal-reached-dash"
    >
      -
    </span>
  )
}

/** The character/MoW name as plain text (activating it opens nothing; the row's Edit action does),
 *  with the Unlock goal's flavor text (and, once the Remaining column is hidden in the compact-desktop
 *  band, its remaining-shard figure too) reachable as a tooltip on the name instead of a persistent
 *  caption line — `goal-progress-display`'s Unlock-tooltip requirement. */
export function GoalNameLink({
  row,
  remainingText,
}: {
  row: GoalRow
  remainingText: string | null
}) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const name = getEntityName(row.entityType, row.entityId)

  const link = <span className="font-medium">{name}</span>

  if (row.goalType !== "Unlock") return link

  const tooltipText = remainingText
    ? `${t("goals.unlockFlavor")} ${remainingText}`
    : t("goals.unlockFlavor")

  return (
    <Tooltip>
      {/* Focusable so the tooltip stays reachable by keyboard now the name is not a button. */}
      <TooltipTrigger asChild>
        <button className="font-medium" type="button">
          {name}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  )
}

/** The goal's account-wide priority position (`globalPriority`), as text so it meets normal text
 * contrast in both themes (`text-foreground`). It is the position in the whole account order, never the
 * visible index, so filtered/project views show gaps. Rows without a position (Reached, Completed,
 * Archived) render nothing. The "Priority" prefix is screen-reader only, so the row's accessible name
 * reads "Priority N". */
export function GoalPriorityNumber({ row }: { row: GoalRow }) {
  const { t } = useTranslation()
  if (row.priority === undefined || !isInFlightStatus(row.status)) return null
  return (
    <span
      className="min-w-5 text-center text-xs font-semibold text-foreground tabular-nums"
      data-testid="goal-row-priority"
    >
      <span className="sr-only">{t("goals.columns.priority")} </span>
      {row.priority}
    </span>
  )
}

/** A goal's selection checkbox. Shift-click selects the range from the goal last toggled (Gmail). */
export function GoalSelectCheckbox({
  goalId,
  entityName,
  selected,
  onToggle,
  onSelectRange,
}: {
  goalId: string
  entityName: string
  selected: boolean
  onToggle?: (goalId: string) => void
  onSelectRange?: (goalId: string) => void
}) {
  const { t } = useTranslation()
  return (
    <Checkbox
      aria-label={t("goals.bulk.selectRow", { entity: entityName })}
      checked={selected}
      data-testid={`goal-row-select-${goalId}`}
      onCheckedChange={() => onToggle?.(goalId)}
      onClick={(event) => {
        if (!event.shiftKey || !onSelectRange) return
        // The range replaces the plain toggle.
        event.preventDefault()
        onSelectRange(goalId)
      }}
    />
  )
}
