import { useRef } from "react"
import type { KeyboardEvent, ReactNode, MouseEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { Search } from "lucide-react"
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

import { NavChildIcon, NavItemIcon } from "./nav-child-icon"
import { NavGroupLabel } from "./nav-group-label"
import { subItemDescription, subItemLabel } from "./nav-items"
import type { NavItem } from "./nav-items"
import { NavLiveDot } from "./nav-live-dot"
import { buildNavigationGroups } from "./navigation-search"
import type { NavigationEntry, NavigationGroup } from "./navigation-search"
import type { QuickActionId, QuickActionsController } from "./quick-actions"

/** `compact`: one line, the description only on the highlighted row (desktop). `comfortable`:
 *  label over description on every row (the phone drawer). */
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
      : "min-h-12 interactive-surface py-2",
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
  focusOnOpen = false,
  density,
  footer,
  getEntryPath,
  inputEnd,
  inputPlacement,
  items,
  onActionSelect,
  onNavigate,
  onSearchChange,
  quickActions,
  search,
}: {
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
  onActionSelect: (id: QuickActionId) => void
  /** A page was opened; the surface closes. */
  onNavigate: () => void
  onSearchChange: (search: string) => void
  quickActions: QuickActionsController
  search: string
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const navigate = useNavigate()
  const groups = buildNavigationGroups({
    actions: quickActions.actions,
    getEntryPath,
    items,
    query: search,
    t,
  })
  const isSearching = search.trim() !== ""
  // The phone drawer is tapped, not arrowed through: it shows the highlight only on a search's top
  // hit (what Go/Enter opens), and the pointer never moves it (no flicker while scrolling).
  const isTouchList = density === "comfortable"
  const showHighlight = !isTouchList || isSearching
  // A modified click (Ctrl/Cmd/Shift) on a page opens it the browser's way (new tab or window);
  // cmdk still reports it as a selection, which must then not also navigate this tab.
  const modifiedClick = useRef(false)

  // cmdk highlights the first enabled row on open and again after every query change.
  const changeSearch = (next: string) => onSearchChange(next)

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
      shouldFilter={false}
    >
      {inputPlacement === "top" ? field : null}
      <CommandList
        className={cn(
          "max-h-none min-h-0 flex-1 scroll-py-2 p-2",
          density === "comfortable" && "px-4"
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
}: {
  density: Density
  group: NavigationGroup
  isSearching: boolean
  onActionSelect: (id: QuickActionId) => void
  onModifiedClick: (modified: boolean) => void
  onOpenPage: (to: string) => void
}) {
  const { t } = useTranslation()
  const heading =
    group.id === "actions"
      ? t("nav.quickActions.heading")
      : t("nav.quickActions.pagesHeading")

  // With no query, a section's children sit indented under it, each group under its label.
  const runs: NavigationEntry[][] = []
  for (const entry of group.entries) {
    const last = runs.at(-1)
    if (!isSearching && entry.kind === "child" && last?.[0]?.kind === "child")
      last.push(entry)
    else runs.push([entry])
  }

  const row = (entry: NavigationEntry) => (
    <PaletteRow
      density={density}
      entry={entry}
      isSearching={isSearching}
      key={entry.key}
      onActionSelect={onActionSelect}
      onModifiedClick={onModifiedClick}
      onOpenPage={onOpenPage}
    />
  )

  return (
    <CommandGroup
      className="p-0 pb-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:text-sm"
      data-testid={group.id === "actions" ? "quick-actions" : "pages"}
      heading={heading}
    >
      {runs.map((run) =>
        !isSearching && run[0]?.kind === "child" ? (
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
}: {
  density: Density
  entry: NavigationEntry
  isSearching: boolean
  onActionSelect: (id: QuickActionId) => void
  onModifiedClick: (modified: boolean) => void
  onOpenPage: (to: string) => void
}) {
  // Also declares the `dailies` namespace (see NavigationPalette).
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()

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
          density={density}
          description={action.disabledReason ?? action.description}
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

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const modified =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    onModifiedClick(modified)
    // A plain click navigates through cmdk's selection (the same path as Enter), so the link's
    // own navigation is suppressed; a modified click keeps the browser's behavior.
    if (!modified) event.preventDefault()
  }

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
          crumb={isSearching && isChild ? entry.crumb : undefined}
          density={density}
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
  density,
  description,
  descriptionAlways = false,
  label,
  live,
}: {
  crumb?: string
  density: Density
  description: ReactNode
  descriptionAlways?: boolean
  label: string
  live?: ReactNode
}) {
  if (density === "comfortable") {
    return (
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{label}</span>
          {crumb ? (
            <span className="shrink-0 font-normal text-muted-foreground">
              · {crumb}
            </span>
          ) : null}
          {live}
        </span>
        <span className="truncate text-xs font-normal text-muted-foreground">
          {description}
        </span>
      </span>
    )
  }
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
