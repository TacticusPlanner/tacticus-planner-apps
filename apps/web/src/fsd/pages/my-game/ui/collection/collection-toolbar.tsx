import { useCallback, useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import {
  activeFilterCount,
  activeStandaloneFilterCount,
  collectionSorts,
  isCollectionSort,
  type CollectionQuery,
  type CollectionQuickFilter,
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
  /** Reads the quick filters' data again after it failed to load. */
  onRetry: () => void
}

/**
 * Search, sort, filters and quick filters above the faction cards. Desktop keeps search, Sort and
 * Filters on one row and opens the filters inline below it (already open when one is set, so a
 * short list is never unexplained); mobile stacks search over Sort and Filters and opens the
 * filters in a bottom sheet. The quick-filter chips wrap below in both forms.
 */
export function CollectionToolbar(props: CollectionToolbarProps) {
  const isMobile = useIsMobile()
  return isMobile ? <MobileToolbar {...props} /> : <DesktopToolbar {...props} />
}

function DesktopToolbar(props: CollectionToolbarProps) {
  const {
    query,
    update,
    clear,
    options,
    rosterAvailable,
    quickFilters,
    onRetry,
  } = props
  const { t } = useTranslation("common")
  const setSearch = useCallback(
    (search: string) => update({ search }),
    [update]
  )
  const [open, setOpen] = useState(() => activeStandaloneFilterCount(query) > 0)
  const panelId = useId()
  const active = activeFilterCount(query)

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center gap-2"
        role="search"
        aria-label={t("myGame.collection.toolbar.label")}
        data-testid="collection-toolbar"
      >
        <SearchField
          value={query.search}
          onChange={setSearch}
          className="min-w-48 flex-1"
        />
        <SortSelect query={query} update={update} />
        <FiltersButton
          count={active}
          expanded={open}
          controls={panelId}
          onClick={() => setOpen((value) => !value)}
        />
        {active > 0 ? <ClearFiltersButton onClick={clear} /> : null}
      </div>
      {open ? (
        <div id={panelId}>
          <CollectionFilterFields
            query={query}
            update={update}
            options={options}
            rosterAvailable={rosterAvailable}
            layout="panel"
          />
        </div>
      ) : null}
      <QuickFilterChips
        value={query.quick}
        availability={quickFilters}
        onChange={(quick) => update({ quick })}
        onRetry={onRetry}
      />
    </div>
  )
}

function MobileToolbar(props: CollectionToolbarProps) {
  const {
    query,
    update,
    clear,
    options,
    rosterAvailable,
    quickFilters,
    onRetry,
  } = props
  const { t } = useTranslation("common")
  const setSearch = useCallback(
    (search: string) => update({ search }),
    [update]
  )
  const [open, setOpen] = useState(false)
  const active = activeFilterCount(query)

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-2"
        role="search"
        aria-label={t("myGame.collection.toolbar.label")}
        data-testid="collection-toolbar"
      >
        <SearchField value={query.search} onChange={setSearch} />
        <div className="grid grid-cols-2 gap-2">
          <SortSelect query={query} update={update} />
          <FiltersButton
            count={active}
            expanded={open}
            onClick={() => setOpen(true)}
          />
        </div>
        {active > 0 ? <ClearFiltersButton onClick={clear} /> : null}
      </div>
      <QuickFilterChips
        value={query.quick}
        availability={quickFilters}
        onChange={(quick) => update({ quick })}
        onRetry={onRetry}
      />
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
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
          <Button onClick={() => setOpen(false)}>
            {t("myGame.collection.toolbar.done")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialog>
    </div>
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
  return (
    <Select
      value={query.sort}
      onValueChange={(sort) => {
        if (isCollectionSort(sort)) update({ sort })
      }}
    >
      {/* A combobox is not named by its content, so the label carries the current sort too. */}
      <SelectTrigger
        className="w-full md:w-44"
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
      <SlidersHorizontal aria-hidden />
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
