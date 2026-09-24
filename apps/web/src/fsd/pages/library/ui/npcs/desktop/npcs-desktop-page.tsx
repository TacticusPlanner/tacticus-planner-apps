import { NpcDetail } from "../npc-detail"
import { NpcList } from "../npc-list"
import { NpcsFilterPanel } from "../npcs-filter-panel"
import type { NpcsPageViewProps } from "../npcs-page.view-model"

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
    <div data-testid="npcs-desktop-page">
      <div
        className="grid gap-6 lg:grid-cols-[minmax(240px,340px)_1fr]"
        data-testid="npcs-columns"
      >
        {/* Filters act on the list only, so they sit above it in the same column rather than
            spanning the page — the placement Character Lookup already uses for its controls. */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-hidden">
          <NpcsFilterPanel
            filters={filters}
            options={filterOptions}
            activeCount={activeFilterCount}
            onChange={onFiltersChange}
            onClear={onClearFilters}
          />
          {/* Only the tiles scroll: the filters stay put so they are reachable however far down
              the roster the selected NPC sits. */}
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
