import { useId, useState, type ReactNode } from "react"
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
 * explains it, and every chip that is on adds one line under the row saying what it changes. The row
 * keeps its own selection until `value` changes: the URL update behind `onChange` commits about a
 * second later on a large account, and a second toggle in that window must start from the first.
 *
 * `layout="inline"` puts the caption on the chips' line and closes the row with `trailing` (Today's
 * other controls), so the notes can take their own full-width lines under the whole row.
 */
export function TodayQuickFilterChips({
  value,
  onChange,
  layout = "stacked",
  trailing,
}: {
  value: readonly TodayQuickFilter[]
  onChange: (next: TodayQuickFilter[]) => void
  layout?: "stacked" | "inline"
  trailing?: ReactNode
}) {
  const { t } = useTranslation("dailies")
  const labelId = useId()
  const [selected, setSelected] = useState(value)
  const [committed, setCommitted] = useState(value)
  if (committed !== value) {
    setCommitted(value)
    setSelected(value)
  }

  const caption = (
    <span id={labelId} className="text-xs text-muted-foreground">
      {t("quickFilters.label")}
    </span>
  )
  const chips = (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="sm"
      spacing={1}
      className="flex-wrap"
      aria-labelledby={labelId}
      value={[...selected]}
      onValueChange={(values) => {
        const next = values.filter(isTodayQuickFilter)
        setSelected(next)
        onChange(next)
      }}
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
  )
  const notes = TODAY_QUICK_FILTERS.filter((quick) =>
    selected.includes(quick)
  ).map((quick) => (
    <p
      key={quick}
      className="text-xs text-muted-foreground"
      data-testid={`today-quick-filter-note-${quick}`}
    >
      {t(`quickFilters.note.${quick}`)}
    </p>
  ))

  if (layout === "inline") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
            data-testid="today-quick-filters"
          >
            {caption}
            {chips}
          </div>
          {trailing}
        </div>
        {notes}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5" data-testid="today-quick-filters">
      {caption}
      {chips}
      {notes}
    </div>
  )
}
