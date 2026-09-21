import { useTranslation } from "react-i18next"
import { Calendar } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { formatEstimateDate } from "@/shared/lib"

import type { EstimateOutcome } from "@/features/goal-farming"
import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { UNKNOWN_PROGRESS } from "../../model/attainment/goal-overview-metrics-defaults"
import type { GoalRow } from "../../model/shared/types"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import { estimateEnergy, stopRowNavigation } from "./goal-row-utils"

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
  if (!estimate || estimate.status === "Blocked") {
    return null
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

/** A merged Level goal's own target (from → to), rendered in the same column/line as its dependent
 * goal's own target rather than crammed into the name cell (`goal-list-layout`: "A Level goal with
 * exactly one dependent renders as that goal's sub-line, not its own row"). Pair with
 * `LevelGoalSubProgress`, placed alongside the dependent's own progress instead — together they
 * mirror the dependent's own Target/Progress split so the merged pair reads like one ordinary row's
 * worth of columns, not a second, differently-shaped block. The Level goal stays a real,
 * independently addressable `Goal` underneath — clicking opens its own detail view, same as any
 * other goal's name link, which is where its own actions (pause, retarget, ...) remain reachable. */
export function LevelGoalSubTarget({
  levelGoalId,
  metrics,
  onView,
}: {
  levelGoalId: string
  metrics: ReadonlyMap<string, GoalOverviewMetrics> | undefined
  onView: (goalId: string) => void
}) {
  const progress = metrics?.get(levelGoalId)?.progress ?? UNKNOWN_PROGRESS

  return (
    <button
      className="mt-1 flex items-center text-left"
      data-testid="level-goal-sub-target"
      onClick={(event) => {
        stopRowNavigation(event)
        onView(levelGoalId)
      }}
      type="button"
    >
      <GoalTargetDisplay progress={progress} />
    </button>
  )
}

/** A merged Level goal's own progress bar/percent/remaining, rendered alongside the dependent
 * goal's own progress — same `GoalProgressDisplay` used everywhere else, so it gets the same
 * reachable-cap marker (`progress.kind === "Level"` already carries its own `reachableRatio`). Its
 * *actual* ratio is not shown: leveling happens as a side effect of ranking up, so how far the
 * character has already leveled reads as a second, redundant number next to the "Lv 44 → 50" text
 * already in the Target column — only how far it *could* get with available resources (potential) is
 * new information here, so `potentialOnly` renders it the same way the app renders potential
 * progress everywhere else (the striped bar, the small primary-colored percent) rather than the
 * usual actual/potential split. See `LevelGoalSubTarget`.
 *
 * The button is `block`, not `flex`, so `GoalProgressDisplay`'s own root (a `grid` box) stretches to
 * the button's full width the ordinary block-layout way — a flex parent instead leaves it sized to
 * its own content (flex items default to shrink-to-fit on the main axis), which collapsed the bar's
 * `flex-1` track to 0 width against the button's family: 0 outer, so it rendered as if it had never
 * gained any layout. */
export function LevelGoalSubProgress({
  levelGoalId,
  metrics,
  estimates,
  potentialProgress,
  onView,
}: {
  levelGoalId: string
  metrics: ReadonlyMap<string, GoalOverviewMetrics> | undefined
  estimates: ReadonlyMap<string, EstimateOutcome> | undefined
  potentialProgress: ReadonlyMap<string, number> | undefined
  onView: (goalId: string) => void
}) {
  const progress = metrics?.get(levelGoalId)?.progress ?? UNKNOWN_PROGRESS
  const remaining = metrics?.get(levelGoalId)?.remaining ?? null
  const energy = estimateEnergy(estimates?.get(levelGoalId))
  const potentialRatio = potentialProgress?.get(levelGoalId)

  return (
    <button
      className="mt-1 block w-full text-left"
      data-testid="level-goal-sub-progress"
      onClick={(event) => {
        stopRowNavigation(event)
        onView(levelGoalId)
      }}
      type="button"
    >
      <GoalProgressDisplay
        energy={energy}
        potentialOnly
        potentialRatio={potentialRatio}
        progress={progress}
        remaining={remaining}
      />
    </button>
  )
}

/** The merged Level goal's own "N levels remaining (M XP)" text, rendered in the dependent goal's
 * Remaining column — `GoalProgressDisplay` already computes the same text for its hover tooltip on
 * desktop, but a sub-line has no separate hover target of its own worth relying on, so this renders
 * it as plain, always-visible text instead (mirrors the mobile card, where `GoalProgressDisplay`'s
 * own footer already shows it inline). */
export function LevelGoalSubRemaining({
  levelGoalId,
  metrics,
}: {
  levelGoalId: string
  metrics: ReadonlyMap<string, GoalOverviewMetrics> | undefined
}) {
  const { t, i18n } = useTranslation()
  const progress = metrics?.get(levelGoalId)?.progress ?? UNKNOWN_PROGRESS
  const remaining = metrics?.get(levelGoalId)?.remaining ?? null
  const remainingText = formatGoalRemainingText(
    t,
    i18n?.resolvedLanguage,
    progress,
    remaining,
    undefined
  )
  if (!remainingText) return null

  return (
    <span
      className="mt-1 block max-w-[190px] truncate text-xs text-muted-foreground"
      data-testid="level-goal-sub-remaining"
      title={remainingText}
    >
      {remainingText}
    </span>
  )
}
