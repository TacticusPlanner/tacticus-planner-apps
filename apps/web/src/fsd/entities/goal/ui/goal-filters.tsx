import { useTranslation } from "react-i18next"
import { ArrowUpDown, Filter, Group as GroupIcon } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { GoalKind } from "../model/types"

export type GoalTypeFilterValue = "all" | GoalKind
export type GoalSortValue = "entity" | "type" | "status" | "updated"
export type GoalGroupValue = "none" | "unit" | "type"

const GOAL_TYPE_VALUES: readonly GoalKind[] = [
  "Rank",
  "Ascension",
  "Ability",
  "Unlock",
  "Upgrade",
  "UpgradeItem",
]
const SORT_VALUES: readonly GoalSortValue[] = [
  "entity",
  "type",
  "status",
  "updated",
]

type Props = {
  goalType: GoalTypeFilterValue
  onGoalTypeChange: (value: GoalTypeFilterValue) => void
  sort: GoalSortValue
  onSortChange: (value: GoalSortValue) => void
  group: GoalGroupValue
  onGroupChange: (value: GoalGroupValue) => void
}

/**
 * Overview's Type/Sort/Group filter row (goals-navigation spec, Decision 1) — extracted verbatim
 * from `goals-page.tsx` (external behavior/testids/mobile pattern unchanged), and relocated here
 * pre-emptively even though only Overview consumes it today. Filter/sort/group *application* to a
 * page's own row data stays with that page (`GoalRow` is page-local); this component only owns the
 * controlled UI for choosing the three values.
 */
export function GoalFilters({
  goalType,
  onGoalTypeChange,
  sort,
  onSortChange,
  group,
  onGroupChange,
}: Props) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const goalTypeLabel =
    goalType === "all"
      ? t("goals.filters.allTypes")
      : t(`goals.create.goalTypes.${goalType}`)
  const sortLabel = t(`goals.filters.sort.${sort}`)
  const groupLabel =
    group === "none"
      ? t("goals.filters.groupNone")
      : group === "unit"
        ? t("goals.filters.groupByUnit")
        : t("goals.filters.groupByType")
  // A stable purpose name for each filter's accessible name, not the current value alone — a
  // screen-reader user on mobile (where the visible `SelectValue` is hidden) would otherwise hear
  // just "Rank" with no indication of what that value is filtering/sorting/grouping by.
  const typeFilterAriaLabel = t("goals.filters.typeFilterLabel")
  const sortAriaLabel = t("goals.filters.sortByLabel")
  const groupAriaLabel = t("goals.filters.groupByLabel")

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(value) =>
          onGoalTypeChange(value as GoalTypeFilterValue)
        }
        value={goalType}
      >
        <SelectTrigger
          aria-describedby="goals-type-filter-value"
          aria-label={typeFilterAriaLabel}
          data-testid="goals-type-filter"
        >
          <Filter />
          {isMobile ? null : <SelectValue />}
          <span className="sr-only" id="goals-type-filter-value">
            {goalTypeLabel}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("goals.filters.allTypes")}</SelectItem>
          {GOAL_TYPE_VALUES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`goals.create.goalTypes.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(value) => onSortChange(value as GoalSortValue)}
        value={sort}
      >
        <SelectTrigger
          aria-describedby="goals-sort-value"
          aria-label={sortAriaLabel}
          data-testid="goals-sort"
        >
          <ArrowUpDown />
          {isMobile ? null : <SelectValue />}
          <span className="sr-only" id="goals-sort-value">
            {sortLabel}
          </span>
        </SelectTrigger>
        <SelectContent>
          {SORT_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`goals.filters.sort.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(value) => onGroupChange(value as GoalGroupValue)}
        value={group}
      >
        <SelectTrigger
          aria-describedby="goals-group-value"
          aria-label={groupAriaLabel}
          data-testid="goals-group-by"
        >
          <GroupIcon />
          {isMobile ? null : <SelectValue />}
          <span className="sr-only" id="goals-group-value">
            {groupLabel}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("goals.filters.groupNone")}</SelectItem>
          <SelectItem value="unit">{t("goals.filters.groupByUnit")}</SelectItem>
          <SelectItem value="type">{t("goals.filters.groupByType")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
