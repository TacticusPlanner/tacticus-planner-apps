import { useRef, useState } from "react"
import type { KeyboardEvent, ReactNode, MouseEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { PlusCircle, Search, SquareLibrary } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandGroup,
  CommandInputField,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { cn } from "@workspace/ui/lib/utils"

import { EmptyState } from "@/shared/ui"

import { matchesNavPath } from "./find-active-child"

import { NavChildIcon, NavItemIcon } from "./nav-child-icon"
import { NavGroupLabel } from "./nav-group-label"
import { subItemDescription, subItemLabel } from "./nav-items"
import type { NavItem } from "./nav-items"
import { NavLiveDot } from "./nav-live-dot"
import { buildNavigationGroups } from "./navigation-search"
import type { NavigationEntry, NavigationGroup } from "./navigation-search"
import type { SearchEntity } from "./entity-search"
import { isGoalUnit, unitOfPath } from "./entity-search"
import type {
  GoalUnit,
  QuickAction,
  QuickActionsController,
  QuickSelection,
} from "./quick-actions"
import { useEntitySearchIndex } from "./use-entity-search-index"
import { RECENT_PAGES_SHOWN, readRecentPages } from "./recent-pages"
import {
  chipPick,
  listPick,
  listRowCount,
  useNavigationSearchTracking,
} from "./navigation-search-analytics"
import type { NavigationSearchSource } from "./navigation-search-analytics"

/** Rows are one line either way, with the description only on the highlighted row. `compact`:
 *  mouse-sized rows (desktop). `comfortable`: touch-sized rows (the phone drawer). */
type Density = "compact" | "comfortable"

// The highlight shows only inside a list that opts in (`data-highlight`, see NavigationPalette).
const ROW_CLASS_NAME =
  "group/nav-row w-full cursor-pointer gap-3 rounded-lg px-3 font-medium in-data-[slot=dialog-content]:rounded-lg data-selected:bg-transparent in-data-[highlight=true]:data-selected:bg-accent/10 in-data-[highlight=true]:data-selected:shadow-[inset_2px_0_0_0_var(--accent)] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"

function rowClassName(density: Density, isChild: boolean) {
  return cn(
    ROW_CLASS_NAME,
    // The phone list's pointer does not move the highlight, so a mouse there gets the plain hover.
    density === "compact"
      ? "min-h-9 py-1.5"
      : "min-h-11 interactive-surface py-2",
    isChild && "font-normal"
  )
}

/**
 * Navigation search as one keyboard-driven list, shared by the desktop dialog and the phone Menu
 * drawer: ↑/↓ (Home/End) or the pointer move one highlight, Enter opens the highlighted page or
 * runs the highlighted action. The caller lays out the surface around it; the field sits at the
 * top (desktop) or bottom (phone), with `footer` after the list.
 */
export function NavigationPalette({
  actionsAsChips = false,
  focusOnOpen = false,
  density,
  footer,
  getEntryPath,
  inputEnd,
  inputPlacement,
  items,
  onActionSelect,
  onNavigate,
  openedVia,
  quickActions,
}: {
  /** With no query, shows the quick actions as a row of chips above the list (the phone). */
  actionsAsChips?: boolean
  /** Moves focus into the field when the palette mounts (the desktop dialog). */
  focusOnOpen?: boolean
  density: Density
  footer?: ReactNode
  getEntryPath: (item: NavItem) => string
  /** Rendered inside the field after the input (the desktop Esc button). */
  inputEnd?: ReactNode
  inputPlacement: "top" | "bottom"
  items: NavItem[]
  /** An enabled action was chosen; the surface closes and dispatches it. */
  onActionSelect: (selection: QuickSelection) => void
  /** A page was opened; the surface closes. */
  onNavigate: () => void
  /** How the surface was opened, for usage analytics. */
  openedVia: NavigationSearchSource
  quickActions: QuickActionsController
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library", "gameUi"])
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The surface mounts this on each opening, so every opening starts with an empty field, and the
  // query stays in view while the surface animates closed.
  const [search, setSearch] = useState("")
  // Read once per opening (the surface mounts this on open): visits made while open don't move it.
  const [storedRecent] = useState(readRecentPages)
  const recentPaths = storedRecent
    .filter((path) => !matchesNavPath(pathname, path))
    .slice(0, RECENT_PAGES_SHOWN)
  const isSearching = search.trim() !== ""
  const showChips = actionsAsChips && !isSearching
  const entities = useEntitySearchIndex({
    withLegendaryEvents: items.some(
      (item) => item.path === "/legendary-events"
    ),
  })
  // Creating a goal for a unit follows Create goal (signed in only).
  const canCreateGoals = quickActions.actions.some(
    (action) => action.id === "createGoal"
  )
  const contextUnit = unitOfPath(entities, pathname)
  const groups = buildNavigationGroups({
    actions: quickActions.actions,
    canCreateGoals,
    collectionPath: items
      .flatMap((item) => item.children ?? [])
      .find((child) => child.path === "/my-game/collection")?.path,
    contextUnit,
    entities,
    getEntryPath,
    items,
    query: search,
    recentPaths,
    t,
  }).filter((group) => !showChips || group.id !== "actions")
  const chipActions = quickActions.actions.filter(
    (action) => !action.searchOnly
  )
  const contextChip = canCreateGoals ? contextUnit : undefined
  // The phone drawer is tapped, not arrowed through: it shows the highlight only on a search's top
  // hit (what Go/Enter opens), and the pointer never moves it (no flicker while scrolling).
  const isTouchList = density === "comfortable"
  const showHighlight = !isTouchList || isSearching
  // A modified click (Ctrl/Cmd/Shift) on a page opens it the browser's way (new tab or window);
  // cmdk still reports it as a selection, which must then not also navigate this tab.
  const modifiedClick = useRef(false)

  const tracking = useNavigationSearchTracking({
    openedVia,
    queryLength: search.trim().length,
    resultCount: listRowCount(groups),
    viewMode: density === "compact" ? "desktop" : "mobile",
  })

  // cmdk highlights the first enabled row on open and again after every query change.
  const changeSearch = (next: string) => setSearch(next)

  const openPage = (to: string) => {
    if (modifiedClick.current) {
      modifiedClick.current = false
      return
    }
    void navigate(to)
    onNavigate()
  }

  // With no query the phone shows no highlight, so Enter (Go) in the field must not open the
  // hidden first row. cmdk skips a key event that is already default-prevented.
  const guardEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !showHighlight) event.preventDefault()
  }

  const field = (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 px-4",
        inputPlacement === "top" ? "h-14 border-b" : "py-3"
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          inputPlacement === "bottom" &&
            "h-10 rounded-2xl border border-muted-foreground/75 bg-input/50 px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring"
        )}
      >
        <Search
          aria-hidden="true"
          className="size-icon shrink-0 text-muted-foreground"
        />
        <CommandInputField
          // The desktop dialog exists to search; focus belongs in its field on open. The phone
          // drawer is also the main menu, so it does not raise the keyboard on open.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={focusOnOpen}
          className="h-full text-base"
          // The phone keyboard's key opens the highlighted top hit.
          enterKeyHint="go"
          onKeyDown={guardEnter}
          onValueChange={changeSearch}
          placeholder={t("nav.search")}
          value={search}
        />
      </div>
      {inputEnd}
    </div>
  )

  return (
    <Command
      className="min-h-0 flex-1 rounded-none bg-transparent p-0"
      data-highlight={showHighlight}
      disablePointerSelection={isTouchList}
      // cmdk names its input by this label (aria-labelledby), so it is the field's name.
      label={t("nav.search")}
      loop
      // Runs before cmdk's own key handling, so a pick by Enter is known as one.
      onKeyDown={(event) => {
        if (event.key === "Enter") tracking.selectMethod("keyboard")
      }}
      onPointerDown={() => tracking.selectMethod("pointer")}
      shouldFilter={false}
    >
      {inputPlacement === "top" ? field : null}
      {showChips && chipActions.length > 0 ? (
        <ActionChips
          actions={chipActions}
          contextUnit={contextChip}
          onActionSelect={(selection) => {
            tracking.reportPick(
              chipPick(
                selection,
                chipActions.map((action) => action.id),
                contextChip !== undefined
              )
            )
            onActionSelect(selection)
          }}
        />
      ) : null}
      <CommandList
        className={cn(
          "flex max-h-none min-h-0 flex-1 scroll-py-2 flex-col p-2",
          density === "comfortable" && "px-4",
          // A field at the bottom: results that fit sit right above it, the best match nearest.
          inputPlacement === "bottom" &&
            isSearching &&
            "*:[[cmdk-list-sizer]]:mt-auto"
        )}
      >
        {groups.length === 0 ? (
          <EmptyState
            actions={
              <Button onClick={() => changeSearch("")} variant="outline">
                {t("nav.clearSearch")}
              </Button>
            }
            className="m-2"
            title={t("nav.noResults")}
            variant="no-match"
          />
        ) : (
          groups.map((group) => (
            <PaletteGroup
              density={density}
              group={group}
              isSearching={isSearching}
              key={group.id}
              onActionSelect={onActionSelect}
              onModifiedClick={(modified) => {
                modifiedClick.current = modified
              }}
              onOpenPage={openPage}
              onPick={(entry) => tracking.reportPick(listPick(groups, entry))}
            />
          ))
        )}
      </CommandList>
      {inputPlacement === "bottom" ? field : null}
      {footer}
    </Command>
  )
}

function PaletteGroup({
  density,
  group,
  isSearching,
  onActionSelect,
  onModifiedClick,
  onOpenPage,
  onPick,
}: {
  density: Density
  group: NavigationGroup
  isSearching: boolean
  onActionSelect: (selection: QuickSelection) => void
  onModifiedClick: (modified: boolean) => void
  onOpenPage: (to: string) => void
  /** A row was chosen (reported before it runs). */
  onPick: (entry: NavigationEntry) => void
}) {
  const { t } = useTranslation(["common", "library", "gameUi"])
  const heading = {
    recent: t("nav.quickActions.recentHeading"),
    actions: t("nav.quickActions.heading"),
    pages: t("nav.quickActions.pagesHeading"),
    characters: t("library:collections.characters.label"),
    mows: t("library:collections.machinesOfWar.label"),
    npcs: t("library:collections.npcs.label"),
    raidBosses: t("library:collections.raidBosses.label"),
    legendaryEvents: t("nav.legendaryEvents"),
  }[group.id]
  // A recent page says where it lives, as search results do; the tree shows that by nesting.
  const showCrumb = isSearching || group.id === "recent"

  // With no query, a section's children sit indented under it, each group under its label.
  const runs: NavigationEntry[][] = []
  for (const entry of group.entries) {
    const last = runs.at(-1)
    if (!showCrumb && entry.kind === "child" && last?.[0]?.kind === "child")
      last.push(entry)
    else runs.push([entry])
  }

  const row = (entry: NavigationEntry) => (
    <PaletteRow
      density={density}
      entry={entry}
      isSearching={isSearching}
      key={entry.key}
      onActionSelect={(selection) => {
        onPick(entry)
        onActionSelect(selection)
      }}
      showCrumb={showCrumb}
      onModifiedClick={onModifiedClick}
      onOpenPage={(to) => {
        onPick(entry)
        onOpenPage(to)
      }}
    />
  )

  return (
    <CommandGroup
      className="p-0 pb-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:text-sm"
      data-testid={
        {
          recent: "recent-pages",
          actions: "quick-actions",
          pages: "pages",
        }[group.id as string] ?? `entities-${group.id}`
      }
      heading={heading}
    >
      {runs.map((run) =>
        !showCrumb && run[0]?.kind === "child" ? (
          <div className="ml-6 border-l pl-2" key={run[0].key}>
            {run.map((entry) => (
              <div key={entry.key}>
                {entry.kind === "child" && entry.groupLabelKey ? (
                  <NavGroupLabel labelKey={entry.groupLabelKey} />
                ) : null}
                {row(entry)}
              </div>
            ))}
          </div>
        ) : (
          run.map(row)
        )
      )}
    </CommandGroup>
  )
}

function PaletteRow({
  density,
  entry,
  isSearching,
  onActionSelect,
  onModifiedClick,
  onOpenPage,
  showCrumb,
}: {
  density: Density
  entry: NavigationEntry
  isSearching: boolean
  onActionSelect: (selection: QuickSelection) => void
  onModifiedClick: (modified: boolean) => void
  onOpenPage: (to: string) => void
  showCrumb: boolean
}) {
  // Also declares the `dailies` namespace (see NavigationPalette).
  const { t } = useTranslation(["common", "dailies", "library", "gameUi"])
  const { pathname } = useLocation()

  if (entry.kind === "unitGoal") {
    return (
      <UnitGoalRow
        density={density}
        entryKey={entry.key}
        onActionSelect={onActionSelect}
        unit={entry.unit}
      />
    )
  }
  if (entry.kind === "entity" || entry.kind === "collectionSearch") {
    return (
      <EntityRow
        density={density}
        entry={entry}
        onModifiedClick={onModifiedClick}
        onOpenPage={onOpenPage}
      />
    )
  }

  if (entry.kind === "action") {
    const { action } = entry
    const disabled = action.disabledReason !== undefined
    return (
      <CommandItem
        className={rowClassName(density, false)}
        data-testid={`quick-action-${action.id}`}
        disabled={disabled}
        onSelect={() => onActionSelect(action.id)}
        value={entry.key}
      >
        <action.icon
          aria-hidden="true"
          className="size-icon shrink-0 text-muted-foreground"
        />
        <RowText
          description={
            action.disabledReason ?? action.status ?? action.description
          }
          // A disabled row always says why, not only while highlighted.
          descriptionAlways={disabled}
          label={action.label}
        />
      </CommandItem>
    )
  }

  const isChild = entry.kind === "child"
  const label = isChild ? subItemLabel(t, entry.item) : t(entry.item.labelKey)
  const description = isChild
    ? subItemDescription(t, entry.item)
    : t(entry.item.descriptionKey)
  const isCurrent = pathname === entry.item.path
  // A section with children leaves the tag to the child it shares a path with (All events).
  const isHere =
    isCurrent && (isChild || (entry.item.children?.length ?? 0) === 0)

  const onClick = linkClick(onModifiedClick)

  return (
    <CommandItem
      asChild
      className={rowClassName(density, isChild)}
      onSelect={() => onOpenPage(entry.to)}
      value={entry.key}
    >
      <Link
        aria-current={isCurrent ? "page" : undefined}
        onClick={onClick}
        // cmdk moves the highlight with the arrow keys; Tab leaves the list instead of walking it.
        tabIndex={-1}
        to={entry.to}
      >
        {isChild ? (
          <NavChildIcon child={entry.item} />
        ) : (
          <NavItemIcon item={entry.item} />
        )}
        <RowText
          crumb={showCrumb && isChild ? entry.crumb : undefined}
          description={description}
          label={label}
          live={<NavLiveDot hidden={isSearching} item={entry.item} />}
        />
        {isHere ? (
          <span className="ml-auto shrink-0 rounded-full border border-accent bg-accent/10 px-2 text-xs/5 font-normal text-foreground">
            {t("nav.youAreHere")}
          </span>
        ) : null}
      </Link>
    </CommandItem>
  )
}

function RowText({
  crumb,
  description,
  descriptionAlways = false,
  label,
  live,
}: {
  crumb?: string
  description: ReactNode
  descriptionAlways?: boolean
  label: string
  live?: ReactNode
}) {
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <span className="truncate">{label}</span>
      {crumb ? (
        <span className="shrink-0 font-normal text-muted-foreground">
          · {crumb}
        </span>
      ) : null}
      {live}
      <span
        className={cn(
          "min-w-0 flex-1 truncate pl-1 text-xs font-normal text-muted-foreground",
          !descriptionAlways &&
            "invisible in-data-[highlight=true]:group-data-selected/nav-row:visible"
        )}
      >
        {description}
      </span>
    </span>
  )
}

/** The phone's quick actions at rest: one scrolling row of chips above the list. A disabled chip
 *  says why in place of its label. */
function ActionChips({
  actions,
  contextUnit,
  onActionSelect,
}: {
  actions: QuickAction[]
  /** The unit whose page is open: "Create goal for <unit>" leads the row. */
  contextUnit?: SearchEntity
  onActionSelect: (selection: QuickSelection) => void
}) {
  const { t } = useTranslation()

  return (
    <div
      aria-label={t("nav.quickActions.heading")}
      className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto px-4 pt-3 pb-1"
      data-testid="quick-action-chips"
      role="group"
    >
      {contextUnit ? (
        <Button
          className="shrink-0 rounded-full font-normal"
          data-testid="quick-action-unitGoal"
          onClick={() =>
            onActionSelect({ createGoalFor: goalUnitOf(contextUnit) })
          }
          type="button"
          variant="outline"
        >
          <PlusCircle aria-hidden="true" />
          {t("nav.quickActions.createGoalFor", { name: contextUnit.name })}
        </Button>
      ) : null}
      {actions.map((action) => {
        const disabled = action.disabledReason !== undefined
        return (
          <Button
            className="shrink-0 rounded-full font-normal"
            data-testid={`quick-action-${action.id}`}
            disabled={disabled}
            key={action.id}
            onClick={() => onActionSelect(action.id)}
            type="button"
            variant="outline"
          >
            <action.icon aria-hidden="true" />
            {disabled ? (
              <>
                <span className="sr-only">{action.label}: </span>
                {action.disabledReason}
              </>
            ) : (
              action.label
            )}
          </Button>
        )
      })}
    </div>
  )
}

function goalUnitOf(unit: SearchEntity): GoalUnit {
  return {
    entityType: unit.kind === "mows" ? "Mow" : "Character",
    entityId: unit.id as GoalUnit["entityId"],
  }
}

/** A game entity's round portrait, or its initial when it has none. */
function EntityPortrait({ entity }: { entity: SearchEntity }) {
  if (entity.iconSrc) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn(
          "-my-0.5 size-icon-md shrink-0 object-cover",
          isGoalUnit(entity) || entity.kind === "legendaryEvents"
            ? "rounded-full"
            : "rounded-md"
        )}
        src={entity.iconSrc}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="-my-0.5 flex size-icon-md shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground"
    >
      {entity.name.charAt(0)}
    </span>
  )
}

/** A result link's click: a plain click navigates through cmdk's selection (the same path as
 *  Enter), so the link's own navigation is suppressed; a modified click keeps the browser's. */
function linkClick(onModifiedClick: (modified: boolean) => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    const modified =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    onModifiedClick(modified)
    if (!modified) event.preventDefault()
  }
}

/** "Create goal for <unit>": opens the new goal form with the unit selected. */
function UnitGoalRow({
  density,
  entryKey,
  onActionSelect,
  unit,
}: {
  density: Density
  entryKey: string
  onActionSelect: (selection: QuickSelection) => void
  unit: SearchEntity
}) {
  const { t } = useTranslation()
  return (
    <CommandItem
      className={rowClassName(density, false)}
      data-testid="quick-action-unitGoal"
      onSelect={() => onActionSelect({ createGoalFor: goalUnitOf(unit) })}
      value={entryKey}
    >
      <PlusCircle
        aria-hidden="true"
        className="size-icon shrink-0 text-muted-foreground"
      />
      <RowText
        description={t("nav.quickActions.createGoalForDescription")}
        label={t("nav.quickActions.createGoalFor", { name: unit.name })}
      />
    </CommandItem>
  )
}

/** A game entity's page, or Collection searched for the query. */
function EntityRow({
  density,
  entry,
  onModifiedClick,
  onOpenPage,
}: {
  density: Density
  entry: Extract<NavigationEntry, { kind: "entity" | "collectionSearch" }>
  onModifiedClick: (modified: boolean) => void
  onOpenPage: (to: string) => void
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const to = entry.kind === "entity" ? entry.entity.to : entry.to
  return (
    <CommandItem
      asChild
      className={rowClassName(density, false)}
      onSelect={() => onOpenPage(to)}
      value={entry.key}
    >
      <Link
        aria-current={pathname === to ? "page" : undefined}
        onClick={linkClick(onModifiedClick)}
        // As on page rows: the arrow keys move through the list, Tab leaves it.
        tabIndex={-1}
        to={to}
      >
        {entry.kind === "entity" ? (
          <EntityPortrait entity={entry.entity} />
        ) : (
          <SquareLibrary
            aria-hidden="true"
            className="size-icon shrink-0 text-muted-foreground"
          />
        )}
        <RowText
          description=""
          label={
            entry.kind === "entity"
              ? entry.entity.name
              : t("nav.quickActions.findInCollection", { query: entry.query })
          }
        />
      </Link>
    </CommandItem>
  )
}
