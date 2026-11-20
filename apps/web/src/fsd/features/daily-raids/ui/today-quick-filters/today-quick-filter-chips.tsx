import { useId, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { FILTER_CHIP_CLASS_NAME } from "@/shared/ui"

import {
  TODAY_QUICK_FILTERS,
  isTodayQuickFilter,
} from "../../model/today-quick-filters/today-quick-filters"
import type { TodayQuickFilter } from "../../model/today-quick-filters/today-quick-filters"
import { hasNode } from "@/shared/lib"

/**
 * Today's quick filters as a multi-select chip row (Collection's chip style). Each chip's tooltip
 * explains it, and every chip that is on adds one line under the row saying what it changes. The row
 * keeps its own selection until `value` changes: the URL update behind `onChange` commits about a
 * second later on a large account, and a second toggle in that window must start from the first.
 *
 * `extra` adds a page's own chips on the same line.
 */
export function TodayQuickFilterChips({
  value,
  onChange,
  hidden = [],
  extra,
}: {
  value: readonly TodayQuickFilter[]
  onChange: (next: TodayQuickFilter[]) => void
  /** Chips not offered right now (e.g. "Raidable only" while today's plan has no manual battle). */
  hidden?: readonly TodayQuickFilter[]
  /** A page's own chips, on the chips' line after Today's (HSE's "Ignore goals"). */
  extra?: ReactNode
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
  const group = (
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
      {TODAY_QUICK_FILTERS.filter((quick) => !hidden.includes(quick)).map(
        (quick) => (
          <ToggleGroupItem
            key={quick}
            value={quick}
            className={FILTER_CHIP_CLASS_NAME}
            title={t(`quickFilters.help.${quick}`)}
            data-testid={`today-quick-filter-${quick}`}
          >
            {t(`quickFilters.chip.${quick}`)}
          </ToggleGroupItem>
        )
      )}
    </ToggleGroup>
  )
  const chips = hasNode(extra) ? (
    <div className="flex flex-wrap items-center gap-1">
      {group}
      {extra}
    </div>
  ) : (
    group
  )
  const notes = TODAY_QUICK_FILTERS.filter(
    (quick) => selected.includes(quick) && !hidden.includes(quick)
  ).map((quick) => (
    <p
      key={quick}
      className="text-xs text-muted-foreground"
      data-testid={`today-quick-filter-note-${quick}`}
    >
      {t(`quickFilters.note.${quick}`)}
    </p>
  ))

  return (
    <div className="flex flex-col gap-1.5" data-testid="today-quick-filters">
      {caption}
      {chips}
      {notes}
    </div>
  )
}
