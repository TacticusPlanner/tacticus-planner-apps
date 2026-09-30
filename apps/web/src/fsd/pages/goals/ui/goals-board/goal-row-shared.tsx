import { useTranslation } from "react-i18next"
import { Calendar } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { formatEstimateDate } from "@/shared/lib"

import {
  resourceLabel,
  type EstimateOutcome,
  type EstimateResourceId,
} from "@/features/goal-farming"
import type { GoalRow } from "../../model/shared/types"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { isInFlightStatus } from "./goal-row-utils"

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
  if (!estimate) return null
  if (estimate.status === "Blocked") {
    return <UnavailableMaterials estimate={estimate} />
  }
  // Shared with the project surfaces, which render the same date from the features layer and so
  // cannot import it from here — see `shared/lib/format-estimate-date`, which also documents the
  // UTC parsing this value needs.
  const formattedDate = formatEstimateDate(
    estimate.date,
    i18n.resolvedLanguage ?? "en"
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

/** Each requirement with no supported source: material, remaining quantity and reason, with no
 * completion date (the goal cannot complete). Same rows on the desktop table and the mobile card. */
function UnavailableMaterials({ estimate }: { estimate: EstimateOutcome }) {
  const { t } = useTranslation(["common", "upgrades", "characters", "dailies"])
  const { upgradesById, charactersById } = useGoalCatalog()
  if (estimate.status !== "Blocked" || !estimate.blockers?.length) return null
  const label = (id: EstimateResourceId) => {
    const fallback = resourceLabel(
      id,
      upgradesById,
      charactersById ?? new Map()
    )
    if (id.startsWith("shard:")) {
      const unitId = id.slice("shard:".length)
      return t("dailies:resource.shards", {
        unit: t(`characters:${unitId}`, { defaultValue: fallback }),
      })
    }
    return t(`upgrades:${id}`, { defaultValue: fallback })
  }
  return (
    <ul
      className="grid gap-0.5 text-xs text-muted-foreground"
      data-testid="goal-unavailable-materials"
    >
      {estimate.blockers.map((blocker) => (
        <li key={blocker.resourceId}>
          {t("common:goals.estimate.unavailableRow", {
            material: label(blocker.resourceId),
            count: blocker.remaining,
            reason: t(`common:goals.estimate.blocked.${blocker.reason}`),
          })}
        </li>
      ))}
    </ul>
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
        <span className="font-medium" tabIndex={0}>
          {name}
        </span>
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
