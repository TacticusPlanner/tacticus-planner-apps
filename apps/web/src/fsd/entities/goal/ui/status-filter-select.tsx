import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

// "toReach"/"reached" mirror the pages' own attainment-derived grouping (computed, not the goal's
// lifecycle `status`); "archived" stays status-driven. Shared here (goals-navigation spec) so
// Overview and Projects present the exact same enum, labels, and reached-indicator behavior instead
// of each maintaining its own near-identical `TabsList`.
export type GoalStatusFilterValue = "toReach" | "reached" | "archived"

const STATUS_VALUES: readonly GoalStatusFilterValue[] = [
  "toReach",
  "reached",
  "archived",
]

export type GoalStatusFilterCounts = Record<GoalStatusFilterValue, number>

/**
 * Shared Unfulfilled/Reached/Archived status filter (goals-navigation spec) — replaces the
 * near-identical `TabsList` previously duplicated on Overview and Projects. Defaults to whatever
 * `value` the caller passes in (both current callers default their own state to "toReach"). Shows a
 * small indicator on the trigger when there's at least one Reached goal and the current selection
 * isn't already "Reached", so a status filtered away from Reached doesn't hide the fact that goals
 * are waiting there.
 */
export function StatusFilterSelect({
  value,
  onValueChange,
  counts,
  testId = "goals-status-filter",
}: {
  value: GoalStatusFilterValue
  onValueChange: (value: GoalStatusFilterValue) => void
  counts: GoalStatusFilterCounts
  testId?: string
}) {
  const { t } = useTranslation()
  const showReachedIndicator = counts.reached > 0 && value !== "reached"
  const hintId = `${testId}-reached-hint`

  return (
    <div className="relative inline-flex">
      <Select
        onValueChange={(next) => onValueChange(next as GoalStatusFilterValue)}
        value={value}
      >
        <SelectTrigger
          aria-describedby={showReachedIndicator ? hintId : undefined}
          data-testid={testId}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_VALUES.map((status) => (
            <SelectItem
              data-testid={`${testId}-option-${status}`}
              key={status}
              value={status}
            >
              {t(`goals.tabs.${status}`)} ({counts[status]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showReachedIndicator ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary"
          data-testid={`${testId}-reached-indicator`}
        />
      ) : null}
      {showReachedIndicator ? (
        <span className="sr-only" id={hintId}>
          {t("goals.filters.reachedIndicatorLabel")}
        </span>
      ) : null}
    </div>
  )
}
