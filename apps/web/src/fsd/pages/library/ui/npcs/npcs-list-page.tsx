import { NpcList } from "./npc-list"
import type { NpcsPageViewProps } from "./npcs-page.view-model"
import { NpcsToolbar } from "./npcs-toolbar"

/** `/library/npcs`: the toolbar and a grid of NPC tiles, each opening that NPC's page (the same
 *  list → page pattern as Characters and Machines of War, on every viewport). */
export function NpcsListPage({
  items,
  filters,
  filterOptions,
  activeFilterCount,
  onFiltersChange,
  onClearFilters,
}: NpcsPageViewProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="npcs-list-page">
      <NpcsToolbar
        filters={filters}
        options={filterOptions}
        activeCount={activeFilterCount}
        onChange={onFiltersChange}
        onClear={onClearFilters}
      />
      <NpcList items={items} onClearFilters={onClearFilters} />
    </div>
  )
}
