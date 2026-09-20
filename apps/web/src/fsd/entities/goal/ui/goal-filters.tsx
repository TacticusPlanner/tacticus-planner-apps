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
]
const SORT_VALUES: readonly GoalSortValue[] = [
  "entity",
  "type",
  "status",
  "updated",
]

type Props = {
  /** Required only while `showTypeFilter` is (its default) `true` — Project Detail, which hides
   *  the control, has no goal-type-filter state at all and omits both. */
  goalType?: GoalTypeFilterValue
  onGoalTypeChange?: (value: GoalTypeFilterValue) => void
  /** Required only while `showSort` is (its default) `true` — Project Detail, which hides the
   *  control, has no sort state at all and omits both. */
  sort?: GoalSortValue
  onSortChange?: (value: GoalSortValue) => void
  group: GoalGroupValue
  onGroupChange: (value: GoalGroupValue) => void
  /** Project Detail hides both (`fix-project-priority-display`): every goal type is always shown
   *  there, and the goal list is always ordered by stored priority with no other order selectable
   *  — so neither control has anything to do on that route. Both default to `true`, matching
   *  Overview's (the only other caller's) unchanged behavior. */
  showTypeFilter?: boolean
  showSort?: boolean
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
  showTypeFilter = true,
  showSort = true,
}: Props) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const goalTypeLabel =
    !goalType || goalType === "all"
      ? t("goals.filters.allTypes")
      : t(`goals.create.goalTypes.${goalType}`)
  const sortLabel = sort ? t(`goals.filters.sort.${sort}`) : ""
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
      {/* Every trigger below hides `SelectValue` on mobile, but Radix's default "item-aligned"
       *  content positioning depends on measuring that node to align the selected item over the
       *  trigger — without it, the content renders far off-screen (at the document's full scroll
       *  height) while the page underneath stays inert (Radix's open-select scroll lock), making
       *  the trigger look unresponsive. `position="popper"` positions the content relative to the
       *  trigger itself instead, which doesn't need `SelectValue` to work. */}
      {showTypeFilter && goalType && onGoalTypeChange ? (
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
          <SelectContent position="popper">
            <SelectItem value="all">{t("goals.filters.allTypes")}</SelectItem>
            {GOAL_TYPE_VALUES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`goals.create.goalTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {showSort && sort && onSortChange ? (
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
          <SelectContent position="popper">
            {SORT_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`goals.filters.sort.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
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
        <SelectContent position="popper">
          <SelectItem value="none">{t("goals.filters.groupNone")}</SelectItem>
          <SelectItem value="unit">{t("goals.filters.groupByUnit")}</SelectItem>
          <SelectItem value="type">{t("goals.filters.groupByType")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
