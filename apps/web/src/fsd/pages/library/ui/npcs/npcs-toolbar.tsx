import { useTranslation } from "react-i18next"

import type { NpcFilters } from "@/entities/npc"
import { FiltersControl, PageToolbar, SearchField } from "@/shared/ui"

import { NpcsFilterBar } from "./npcs-filter-bar"
import type { NpcFilterOptions } from "./npcs-page.view-model"

/**
 * The NPCs page toolbar (ui-style-guide rule 2). Find: name search, always visible on the list (it
 * is how you reach an NPC you already have in mind, not one of the filters), then the shared
 * "Filters" button with the active count. The filters open in a popover on desktop and a bottom
 * sheet on mobile (`FiltersControl`). An NPC's page keeps only Filters (`showSearch={false}`): they
 * also narrow its variations and encounter rows, and what Previous / Next step through.
 */
export function NpcsToolbar({
  filters,
  options,
  activeCount,
  onChange,
  onClear,
  showSearch = true,
}: {
  filters: NpcFilters
  options: NpcFilterOptions
  activeCount: number
  onChange: (filters: NpcFilters) => void
  onClear: () => void
  showSearch?: boolean
}) {
  const { t } = useTranslation("library")

  return (
    <PageToolbar
      find={
        <>
          {showSearch ? (
            <SearchField
              label={t("npcs.search")}
              onChange={(search) => onChange({ ...filters, search })}
              testId="npcs-search"
              value={filters.search}
            />
          ) : null}
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
