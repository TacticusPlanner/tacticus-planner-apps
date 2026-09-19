import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Calendar } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { EstimateOutcome } from "@/features/goal-farming"
import type { GoalRow } from "../../model/shared/types"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { stopRowNavigation } from "./goal-row-utils"

/** The formatted completion date + "in {{days}} days" caption for a computed estimate, nothing when
 * there's no entry for this goal (no project selected, non-Rank goal type) or the farm is blocked —
 * `BlockedIndicator` (rendered alongside `StatusBadge` in the same cell/card) already surfaces that
 * state, with a tooltip naming the specific reason; repeating a second "Blocked" label here duplicated
 * it. Identical rendering on the desktop table and the mobile card (goal-list-estimate-display spec:
 * no compact mobile variant). */
export function EstimateCell({
  estimate,
}: {
  estimate: EstimateOutcome | undefined
}) {
  const { t, i18n } = useTranslation()
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    [i18n.resolvedLanguage]
  )
  if (!estimate || estimate.status === "Blocked") {
    return null
  }
  // `estimate.date` is a "YYYY-MM-DD" string produced in UTC (estimate.ts's formatDate); parsing its
  // components explicitly via Date.UTC keeps the displayed day from rolling back for viewers west of
  // UTC, rather than trusting `new Date(dateString)`'s default (also-UTC, but easy to get wrong) or
  // the formatter's default local time zone.
  const [year, month, day] = estimate.date.split("-").map(Number)
  const formattedDate = dateFormatter.format(
    new Date(Date.UTC(year, month - 1, day))
  )
  return (
    <span
      className="flex items-center gap-1 text-xs text-muted-foreground"
      data-testid="goal-row-estimate"
      title={estimate.date}
    >
      <Calendar className="size-3.5 shrink-0" />
      {formattedDate} · {t("goals.estimate.days", { days: estimate.days })}
    </span>
  )
}

/** The character/MoW name, with the Unlock goal's flavor text (and, once the Remaining column is
 *  hidden in the compact-desktop band, its remaining-shard figure too) reachable as a tooltip on the
 *  name instead of a persistent caption line — `goal-progress-display`'s Unlock-tooltip requirement. */
export function GoalNameLink({
  row,
  remainingText,
  onView,
}: {
  row: GoalRow
  remainingText: string | null
  onView: (goalId: string) => void
}) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const name = getEntityName(row.entityType, row.entityId)

  const link = (
    <Button
      className="h-auto p-0 font-medium"
      onClick={(event) => {
        stopRowNavigation(event)
        onView(row.goalId)
      }}
      variant="link"
    >
      {name}
    </Button>
  )

  if (row.goalType !== "Unlock") return link

  const tooltipText = remainingText
    ? `${t("goals.unlockFlavor")} ${remainingText}`
    : t("goals.unlockFlavor")

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  )
}
