import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { FILTER_CHIP_CLASS_NAME } from "@/shared/ui"

import {
  TODAY_QUICK_FILTERS,
  isTodayQuickFilter,
  type TodayQuickFilter,
} from "../../model/today-quick-filters/today-quick-filters"

/**
 * Today's quick filters as a multi-select chip row (Collection's chip style). Each chip's tooltip
 * explains it, and every chip that is on adds one line under the row saying what it changes.
 */
export function TodayQuickFilterChips({
  value,
  onChange,
}: {
  value: readonly TodayQuickFilter[]
  onChange: (next: TodayQuickFilter[]) => void
}) {
  const { t } = useTranslation("dailies")
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1.5" data-testid="today-quick-filters">
      <span id={labelId} className="text-xs text-muted-foreground">
        {t("quickFilters.label")}
      </span>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
        aria-labelledby={labelId}
        value={[...value]}
        onValueChange={(next) => onChange(next.filter(isTodayQuickFilter))}
      >
        {TODAY_QUICK_FILTERS.map((quick) => (
          <ToggleGroupItem
            key={quick}
            value={quick}
            className={FILTER_CHIP_CLASS_NAME}
            title={t(`quickFilters.help.${quick}`)}
            data-testid={`today-quick-filter-${quick}`}
          >
            {t(`quickFilters.chip.${quick}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {TODAY_QUICK_FILTERS.filter((quick) => value.includes(quick)).map(
        (quick) => (
          <p
            key={quick}
            className="text-xs text-muted-foreground"
            data-testid={`today-quick-filter-note-${quick}`}
          >
            {t(`quickFilters.note.${quick}`)}
          </p>
        )
      )}
    </div>
  )
}
