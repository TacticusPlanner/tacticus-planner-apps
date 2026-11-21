import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Input } from "@workspace/ui/components/input"

import type { NpcFilters } from "@/entities/npc"
import { FiltersControl, PageToolbar } from "@/shared/ui"

import { NpcsFilterBar } from "./npcs-filter-bar"
import type { NpcFilterOptions } from "./npcs-page.view-model"

/**
 * The NPCs page toolbar (ui-style-guide rule 2). Find: name search, always visible (it is how you
 * reach an NPC you already have in mind, not one of the filters), then the shared "Filters" button
 * with the active count. The filters open in a popover on desktop and a bottom sheet on mobile
 * (`FiltersControl`), so the list and the detail stay where they are.
 */
export function NpcsToolbar({
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

  return (
    <PageToolbar
      find={
        <>
          <div className="relative min-w-40 flex-1 sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filters.search}
              onChange={(event) =>
                onChange({ ...filters, search: event.target.value })
              }
              placeholder={t("npcs.searchPlaceholder")}
              aria-label={t("npcs.search")}
              className="pl-8"
              data-testid="npcs-search"
            />
          </div>
          <FiltersControl
            count={activeCount}
            onClear={onClear}
            size="compact"
            testId="npcs-filters"
          >
            <NpcsFilterBar
              filters={filters}
              options={options}
              onChange={onChange}
            />
          </FiltersControl>
        </>
      }
      testId="npcs-toolbar"
    />
  )
}
