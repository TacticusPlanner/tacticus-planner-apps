import { NpcDetail } from "../npc-detail"
import { NpcList } from "../npc-list"
import type { NpcsPageViewProps } from "../npcs-page.view-model"
import { NpcsToolbar } from "../npcs-toolbar"

export function NpcsDesktopPage(props: NpcsPageViewProps) {
  const {
    items,
    filters,
    filterOptions,
    activeFilterCount,
    onFiltersChange,
    onClearFilters,
    selectedId,
    onSelect,
  } = props

  return (
    <div className="flex flex-col gap-4" data-testid="npcs-desktop-page">
      <NpcsToolbar
        filters={filters}
        options={filterOptions}
        activeCount={activeFilterCount}
        onChange={onFiltersChange}
        onClear={onClearFilters}
      />
      <div
        className="grid gap-6 lg:grid-cols-[minmax(15rem,21.25rem)_1fr]"
        data-testid="npcs-columns"
      >
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-hidden">
          {/* Only the tiles scroll, so the selected NPC's detail stays beside them. */}
          <div className="min-h-0 lg:overflow-y-auto">
            <NpcList
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              onClearFilters={onClearFilters}
            />
          </div>
        </div>
        <div className="min-w-0">
          <NpcDetail {...props} />
        </div>
      </div>
    </div>
  )
}
