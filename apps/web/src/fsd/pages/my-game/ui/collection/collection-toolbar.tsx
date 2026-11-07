import { useCallback, useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
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
  collectionLayouts,
  collectionSorts,
  isCollectionLayout,
  isCollectionSort,
  type CollectionLayout,
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
 * Search, sort, filters, the view switch and quick filters above the faction groups. Desktop keeps
 * search, Sort, Filters, the view switch, the grouping and Unowned toggles on one wrapping row and opens the
 * filters inline below it (already open when one is set, so a short list is never unexplained).
 * Mobile keeps it to three short rows: search with an icon Filters button, Sort with icon view
 * buttons, then the grouping and Unowned switches side by side; the filters open in a bottom sheet
 * and the quick-filter chips scroll sideways in one row. Desktop wraps its chips below.
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
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
          data-testid="collection-view-switch"
        >
          <ViewButtons query={query} update={update} />
          <GroupToggle query={query} update={update} />
          <UnownedToggle
            query={query}
            update={update}
            rosterAvailable={rosterAvailable}
          />
        </div>
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
        <div className="flex gap-2">
          <SearchField
            value={query.search}
            onChange={setSearch}
            className="min-w-0 flex-1"
          />
          <FiltersButton
            count={active}
            expanded={open}
            onClick={() => setOpen(true)}
            compact
          />
        </div>
        <div
          className="flex flex-col gap-1"
          data-testid="collection-view-switch"
        >
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <SortSelect query={query} update={update} />
            </div>
            <ViewButtons query={query} update={update} compact />
          </div>
          <div className="flex flex-wrap items-center gap-x-4">
            <GroupToggle query={query} update={update} />
            <UnownedToggle
              query={query}
              update={update}
              rosterAvailable={rosterAvailable}
            />
          </div>
        </div>
        {active > 0 ? <ClearFiltersButton onClick={clear} /> : null}
      </div>
      <QuickFilterChips
        value={query.quick}
        availability={quickFilters}
        onChange={(quick) => update({ quick })}
        onRetry={onRetry}
        scroll
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
  compact = false,
}: {
  count: number
  expanded: boolean
  controls?: string
  onClick: () => void
  /** Icon only, with the active count as a badge (the mobile search row). */
  compact?: boolean
}) {
  const { t } = useTranslation("common")
  const label =
    count > 0
      ? t("myGame.collection.toolbar.filtersCount", { count })
      : t("myGame.collection.toolbar.filters")
  if (compact) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="relative size-8 shrink-0"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onClick}
      >
        <SlidersHorizontal aria-hidden />
        {count > 0 ? (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs leading-5 font-semibold text-primary-foreground tabular-nums"
          >
            {count}
          </span>
        ) : null}
      </Button>
    )
  }
  return (
    <Button
      variant="outline"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <SlidersHorizontal aria-hidden />
      {label}
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

/**
 * Desktop: the views as one joined segmented control, the site's mode switch (the Library unit
 * page's Starting | Custom, the theme switcher).
 */
function ViewButtons({
  query,
  update,
  compact = false,
}: Pick<CollectionToolbarProps, "query" | "update"> & {
  /** Icons only, named for screen readers (the mobile sort row). */
  compact?: boolean
}) {
  const { t } = useTranslation("common")
  return (
    <ToggleGroup
      aria-label={t("myGame.collection.toolbar.view")}
      type="single"
      variant="outline"
      spacing={0}
      value={query.view}
      onValueChange={(view) => {
        // Radix emits "" when the selected item is clicked again; a view is always shown.
        if (isCollectionLayout(view)) update({ view })
      }}
    >
      {collectionLayouts.map((layout) => {
        const Icon = layoutIcons[layout]
        return (
          <ToggleGroupItem
            key={layout}
            value={layout}
            className={compact ? "h-8 w-9" : "px-3"}
            aria-label={
              compact
                ? t(`myGame.collection.toolbar.views.${layout}`)
                : undefined
            }
          >
            <Icon aria-hidden />
            {compact ? null : t(`myGame.collection.toolbar.views.${layout}`)}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}

/** A labelled on/off switch, the site's toolbar toggle (as the tier list's "Only owned"). */
function ToolbarSwitch({
  label,
  checked,
  onCheckedChange,
  disabledHint,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Disables the switch and says why, next to it. */
  disabledHint?: string
}) {
  const id = useId()
  const hintId = useId()
  return (
    <div className="flex min-h-11 items-center gap-2 md:min-h-0">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabledHint !== undefined}
        aria-describedby={disabledHint ? hintId : undefined}
      />
      <Label htmlFor={id}>{label}</Label>
      {disabledHint ? (
        <span id={hintId} className="text-xs text-muted-foreground">
          {disabledHint}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Hides the units the player does not own: a display setting kept in `?owned=owned`, not a filter.
 * Without a roster nothing can be owned, so it is disabled and explained.
 */
function UnownedToggle({
  query,
  update,
  rosterAvailable,
}: Pick<CollectionToolbarProps, "query" | "update" | "rosterAvailable">) {
  const { t } = useTranslation("common")
  return (
    <ToolbarSwitch
      label={t("myGame.collection.toolbar.hideUnowned")}
      checked={query.hideUnowned}
      onCheckedChange={(hideUnowned) => update({ hideUnowned })}
      disabledHint={
        rosterAvailable
          ? undefined
          : t("myGame.collection.toolbar.hideUnownedNeedsRoster")
      }
    />
  )
}

/** On while units are grouped by faction; off lists them together across factions. */
function GroupToggle({
  query,
  update,
}: Pick<CollectionToolbarProps, "query" | "update">) {
  const { t } = useTranslation("common")
  return (
    <ToolbarSwitch
      label={t("myGame.collection.toolbar.groupByFaction")}
      checked={query.group === "faction"}
      onCheckedChange={(grouped) =>
        update({ group: grouped ? "faction" : "none" })
      }
    />
  )
}
