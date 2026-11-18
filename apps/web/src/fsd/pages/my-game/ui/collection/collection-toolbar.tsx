import { useCallback, useEffect, useId, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { LayoutGrid, List, Search, Funnel, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  FILTER_CHIP_CLASS_NAME,
  GroupByControl,
  PageToolbar,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SegmentedControl,
  useViewPlacement,
} from "@/shared/ui"

import {
  activeFilterCount,
  activeStandaloneFilterCount,
  collectionLayouts,
  collectionSorts,
  isCollectionSort,
} from "../../model/collection-query"
import type {
  CollectionGrouping,
  CollectionLayout,
  CollectionQuery,
  CollectionQuickFilter,
} from "../../model/collection-query"
import type { CollectionOptions } from "../../model/use-collection-options"
import type { QuickFilterAvailability } from "../../model/use-collection-view"
import { CollectionFilterFields } from "./collection-filter-fields"
import { QuickFilterChips } from "./quick-filter-chips"

export interface CollectionToolbarProps {
  query: CollectionQuery
  update: (patch: Partial<CollectionQuery>) => void
  clear: () => void
  options: CollectionOptions
  rosterAvailable: boolean
  quickFilters: Record<CollectionQuickFilter, QuickFilterAvailability>
  /** How many units each quick filter would list, shown on its chip. */
  quickCounts?: Record<CollectionQuickFilter, number>
  /** Reads the quick filters' data again after it failed to load. */
  onRetry: () => void
  /** The page's other Find controls after Filters: Select units and Snapshots. */
  findActions?: ReactNode
}

/**
 * Collection's page toolbar (ui-style-guide rule 2). Find: search and the "Filters" button (badge =
 * active count); the chip row below starts with "Owned only", then the quick filters. View: Layout
 * (Cards / Roster), Group by (None / Faction) and Sort, which mobile keeps in the View sheet.
 * Desktop opens the filters inline below the row (already open when one is set, so a short list is
 * never unexplained); mobile opens them in a bottom sheet. The chips scroll sideways in one row.
 */
export function CollectionToolbar(props: CollectionToolbarProps) {
  const {
    query,
    update,
    clear,
    options,
    rosterAvailable,
    quickFilters,
    quickCounts,
    onRetry,
    findActions,
  } = props
  const { t } = useTranslation("common")
  const isMobile = useIsMobile()
  const setSearch = useCallback(
    (search: string) => update({ search }),
    [update]
  )
  // Desktop: the inline panel's open state. Mobile: the sheet's (closed until asked for).
  const [panelOpen, setPanelOpen] = useState(
    () => activeStandaloneFilterCount(query) > 0
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const panelId = useId()
  const active = activeFilterCount(query)

  return (
    <>
      <PageToolbar
        below={
          !isMobile && panelOpen ? (
            <div id={panelId}>
              <CollectionFilterFields
                query={query}
                update={update}
                options={options}
                rosterAvailable={rosterAvailable}
                layout="panel"
              />
            </div>
          ) : null
        }
        chips={
          <QuickFilterChips
            value={query.quick}
            availability={quickFilters}
            counts={quickCounts}
            onChange={(quick) => update({ quick })}
            onRetry={onRetry}
            leading={
              <OwnedOnlyChip
                query={query}
                update={update}
                rosterAvailable={rosterAvailable}
              />
            }
          />
        }
        find={
          <div
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            role="search"
            aria-label={t("myGame.collection.toolbar.label")}
          >
            <SearchField
              value={query.search}
              onChange={setSearch}
              className="min-w-40 flex-1"
            />
            <FiltersButton
              count={active}
              expanded={isMobile ? sheetOpen : panelOpen}
              controls={isMobile ? undefined : panelId}
              onClick={() =>
                isMobile ? setSheetOpen(true) : setPanelOpen((value) => !value)
              }
            />
            {active > 0 ? <ClearFiltersButton onClick={clear} /> : null}
            {findActions}
          </div>
        }
        testId="collection-toolbar"
        view={
          <>
            <LayoutControl query={query} update={update} />
            <GroupControl query={query} update={update} />
            <SortSelect query={query} update={update} />
          </>
        }
        viewTestId="collection-view-switch"
      />
      {isMobile ? (
        <ResponsiveDialog
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          data-testid="collection-filter-sheet"
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t("myGame.collection.toolbar.filters")}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <CollectionFilterFields
              query={query}
              update={update}
              options={options}
              rosterAvailable={rosterAvailable}
              layout="sheet"
            />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button variant="ghost" onClick={clear} disabled={active === 0}>
              <X aria-hidden />
              {t("myGame.collection.toolbar.clearFilters")}
            </Button>
            <Button onClick={() => setSheetOpen(false)}>
              {t("myGame.collection.toolbar.done")}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialog>
      ) : null}
    </>
  )
}

const SEARCH_DELAY_MS = 200

/**
 * The search box keeps what the player types and sends it to the URL once typing pauses, so a
 * keystroke never waits on a navigation and a list rebuild. A URL change made elsewhere (Clear
 * filters, Back) replaces the text; the echo of a value it sent itself does not.
 */
function SearchField({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const { t } = useTranslation("common")
  const [draft, setDraft] = useState(value)
  const [followed, setFollowed] = useState(value)
  const [sent, setSent] = useState<string | null>(null)
  if (value !== followed) {
    setFollowed(value)
    if (value !== sent) setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => {
      setSent(draft)
      onChange(draft)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t("myGame.collection.toolbar.searchPlaceholder")}
        aria-label={t("myGame.collection.toolbar.search")}
        className="pl-8"
      />
    </div>
  )
}

function SortSelect({
  query,
  update,
}: Pick<CollectionToolbarProps, "query" | "update">) {
  const { t } = useTranslation("common")
  const inSheet = useViewPlacement() === "sheet"
  return (
    <Select
      value={query.sort}
      onValueChange={(sort) => {
        if (isCollectionSort(sort)) update({ sort })
      }}
    >
      {/* A combobox is not named by its content, so the label carries the current sort too. */}
      <SelectTrigger
        className={inSheet ? "w-full" : "w-44"}
        aria-label={`${t("myGame.collection.toolbar.sort")}: ${t(`myGame.collection.toolbar.sortOptions.${query.sort}`)}`}
      >
        <span className="text-muted-foreground">
          {t("myGame.collection.toolbar.sort")}:
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {collectionSorts.map((sort) => (
          <SelectItem key={sort} value={sort}>
            {t(`myGame.collection.toolbar.sortOptions.${sort}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function FiltersButton({
  count,
  expanded,
  controls,
  onClick,
}: {
  count: number
  expanded: boolean
  controls?: string
  onClick: () => void
}) {
  const { t } = useTranslation("common")
  return (
    <Button
      variant="outline"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <Funnel aria-hidden />
      {count > 0
        ? t("myGame.collection.toolbar.filtersCount", { count })
        : t("myGame.collection.toolbar.filters")}
    </Button>
  )
}

function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation("common")
  return (
    <Button variant="ghost" onClick={onClick} className="justify-self-start">
      <X aria-hidden />
      {t("myGame.collection.toolbar.clearFilters")}
    </Button>
  )
}

const layoutIcons: Record<CollectionLayout, LucideIcon> = {
  cards: LayoutGrid,
  roster: List,
}

/** Layout: Cards / Roster, the shared labelled segmented control. */
function LayoutControl({
  query,
  update,
}: Pick<CollectionToolbarProps, "query" | "update">) {
  const { t } = useTranslation("common")
  return (
    <SegmentedControl
      label={t("pageToolbar.layout")}
      onValueChange={(view) => update({ view })}
      options={collectionLayouts.map((layout) => {
        const Icon = layoutIcons[layout]
        return {
          value: layout,
          label: t(`myGame.collection.toolbar.views.${layout}`),
          icon: <Icon aria-hidden />,
        }
      })}
      value={query.view}
    />
  )
}

/** None first, as on every page's Group by. */
const groupOrder: readonly CollectionGrouping[] = ["none", "faction"]

/** Group by: None lists every unit together across factions; Faction groups them. */
function GroupControl({
  query,
  update,
}: Pick<CollectionToolbarProps, "query" | "update">) {
  const { t } = useTranslation("common")
  return (
    <GroupByControl
      onValueChange={(group) => update({ group })}
      options={groupOrder.map((group) => ({
        value: group,
        label: t(`myGame.collection.toolbar.groupOptions.${group}`),
      }))}
      testId="collection-group-by"
      value={query.group}
    />
  )
}

/**
 * Lists only the units the player owns: a filter chip kept in `?owned=owned`. Without a roster
 * nothing can be owned, so it is disabled and says why on hover and to screen readers.
 */
function OwnedOnlyChip({
  query,
  update,
  rosterAvailable,
}: Pick<CollectionToolbarProps, "query" | "update" | "rosterAvailable">) {
  const { t } = useTranslation("common")
  const hintId = useId()
  const hint = rosterAvailable
    ? undefined
    : t("myGame.collection.toolbar.hideUnownedNeedsRoster")
  return (
    <>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        spacing={1}
        className="shrink-0"
        value={query.hideUnowned ? ["owned"] : []}
        onValueChange={(values) =>
          update({ hideUnowned: values.includes("owned") })
        }
        disabled={!rosterAvailable}
      >
        <ToggleGroupItem
          value="owned"
          className={FILTER_CHIP_CLASS_NAME}
          aria-describedby={hint ? hintId : undefined}
          data-testid="owned-only-chip"
          title={hint}
        >
          {t("myGame.collection.toolbar.ownedOnly")}
        </ToggleGroupItem>
      </ToggleGroup>
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
    </>
  )
}
