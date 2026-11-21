import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { GroupByControl, SegmentedControl } from "@/shared/ui"

import { GOAL_TYPE_VALUES } from "../model/types"
import type { GoalKind } from "../model/types"

export type GoalTypeFilterValue = "all" | GoalKind
/** Groups come out in the order of their first goal under the current Sort. */
export type GoalGroupValue = "none" | "unit" | "type"

const DEFAULT_GROUP_OPTIONS: readonly GoalGroupValue[] = [
  "none",
  "unit",
  "type",
]

/** `priority`: the account-wide priority order (the only order goals can be dragged in).
 *  `finishDate`: the estimated finish date in that plan, soonest first; goals without one last. */
export type GoalSortValue = "priority" | "finishDate"

const GOAL_SORT_VALUES: readonly GoalSortValue[] = ["priority", "finishDate"]

/**
 * The Goals page's Type filter, a Find-slot select (goals-navigation spec, Decision 1). Filter
 * *application* to a page's own row data stays with that page (`GoalRow` is page-local); this
 * component only owns the controlled UI for choosing the value.
 */
export function GoalFilters({
  goalType,
  onGoalTypeChange,
}: {
  goalType: GoalTypeFilterValue
  onGoalTypeChange: (value: GoalTypeFilterValue) => void
}) {
  const { t } = useTranslation()

  const goalTypeLabel =
    goalType === "all"
      ? t("goals.filters.allTypes")
      : t(`goals.create.goalTypes.${goalType}`)

  // The trigger shows the chosen type on every viewport (no icon-only select: ui-style-guide rule
  // 3). Its name stays the stable purpose ("Goal type filter") and the value is also said through
  // `aria-describedby`. The list is positioned against the trigger (`position="popper"`).
  return (
    <Select
      onValueChange={(value) => onGoalTypeChange(value as GoalTypeFilterValue)}
      value={goalType}
    >
      <SelectTrigger
        aria-describedby="goals-type-filter-value"
        aria-label={t("goals.filters.typeFilterLabel")}
        data-testid="goals-type-filter"
      >
        <SelectValue />
        <span className="sr-only" id="goals-type-filter-value">
          {goalTypeLabel}
        </span>
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value="all">{t("goals.filters.allTypes")}</SelectItem>
        {GOAL_TYPE_VALUES.map((type) => (
          <SelectItem key={type} value={type}>
            {t(`goals.create.goalTypes.${type}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Group by for a goal list: the shared labelled segmented control in the page toolbar's View slot
 * (ui-style-guide rule 3). `groupOptions` limits the choices (default: all three).
 */
export function GoalGroupBy({
  group,
  onGroupChange,
  groupOptions = DEFAULT_GROUP_OPTIONS,
}: {
  group: GoalGroupValue
  onGroupChange: (value: GoalGroupValue) => void
  groupOptions?: readonly GoalGroupValue[]
}) {
  const { t } = useTranslation()
  return (
    <GroupByControl
      onValueChange={onGroupChange}
      options={groupOptions.map((value) => ({
        value,
        label: t(`goals.filters.groupOptions.${value}`),
        testId: `goals-group-by-${value}`,
      }))}
      testId="goals-group-by"
      value={group}
    />
  )
}

/** Sort for the Goals list: the shared labelled segmented control in the View slot. */
export function GoalSort({
  sort,
  onSortChange,
}: {
  sort: GoalSortValue
  onSortChange: (value: GoalSortValue) => void
}) {
  const { t } = useTranslation()
  return (
    <SegmentedControl
      label={t("goals.filters.sort")}
      onValueChange={onSortChange}
      options={GOAL_SORT_VALUES.map((value) => ({
        value,
        label: t(`goals.filters.sortOptions.${value}`),
        title: t(`goals.filters.sortHelp.${value}`),
        testId: `goals-sort-${value}`,
      }))}
      testId="goals-sort"
      value={sort}
    />
  )
}
