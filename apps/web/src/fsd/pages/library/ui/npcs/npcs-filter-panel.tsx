import { useState } from "react"
import { useTranslation } from "react-i18next"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import type { NpcFilters } from "@/entities/npc"

import { NpcsFilterBar } from "./npcs-filter-bar"
import type { NpcFilterOptions } from "./npcs-page.view-model"

/**
 * Name search sits above the list at all times — it is how you reach a unit you already have in
 * mind, and it is not one of the filters. The narrowing controls below it collapse behind a toggle,
 * because the tile list (desktop) and the detail (mobile) are what a visitor came for and six
 * stacked controls push them down. They open automatically when a filter is already active, so the
 * reason a list looks short is never hidden, and the toggle carries the active count while closed.
 */
export function NpcsFilterPanel({
  filters,
  options,
  activeCount,
  onChange,
  onClear,
}: {
  filters: NpcFilters
  options: NpcFilterOptions
  activeCount: number
  onChange: (filters: NpcFilters) => void
  onClear: () => void
}) {
  const { t } = useTranslation("library")
  const [open, setOpen] = useState(activeCount > 0)

  return (
    <div className="flex flex-col gap-2" data-testid="npcs-filter-panel">
      <Input
        type="search"
        value={filters.search}
        onChange={(event) =>
          onChange({ ...filters, search: event.target.value })
        }
        placeholder={t("npcs.searchPlaceholder")}
        aria-label={t("npcs.search")}
        data-testid="npcs-search"
      />
      <Button
        variant="outline"
        size="sm"
        className="justify-start"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        data-testid="npcs-filters-toggle"
      >
        <SlidersHorizontal aria-hidden />
        {activeCount > 0
          ? t("npcs.filtersCount", { count: activeCount })
          : t("npcs.filters")}
      </Button>
      {open ? (
        <NpcsFilterBar
          filters={filters}
          options={options}
          activeCount={activeCount}
          onChange={onChange}
          onClear={onClear}
        />
      ) : null}
    </div>
  )
}
