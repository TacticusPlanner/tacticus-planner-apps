import { Fragment } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { NavChildIcon } from "./nav-child-icon"
import { NavGroupLabel } from "./nav-group-label"
import { groupNavChildren } from "./nav-groups"
import { NavLiveDot } from "./nav-live-dot"
import { subItemDescription, subItemLabel } from "./nav-items"
import type { NavSubItem } from "./nav-items"

function MobileDrawerSubItem({
  hideLive = false,
  item,
  onSelect,
  pathname,
}: {
  /** Search results show no live indicator. */
  hideLive?: boolean
  item: NavSubItem
  onSelect: () => void
  pathname: string
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const isActive = pathname === item.path

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent/15 font-semibold text-foreground shadow-[inset_3px_0_0_0_var(--accent)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      onClick={onSelect}
      to={item.path}
    >
      <NavChildIcon child={item} />
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center">
          <span className="truncate">{subItemLabel(t, item)}</span>
          <NavLiveDot hidden={hideLive} item={item} />
        </span>
        <span className="truncate text-xs font-normal opacity-80">
          {subItemDescription(t, item)}
        </span>
      </span>
    </Link>
  )
}

/** A section's children in the drawer, each group under its label (Guild: Guild, Guild War). */
export function MobileDrawerSubItems({
  hideLive = false,
  items,
  onSelect,
  pathname,
}: {
  hideLive?: boolean
  items: readonly NavSubItem[]
  onSelect: () => void
  pathname: string
}) {
  return groupNavChildren(items).map((group) => (
    <Fragment key={group.labelKey ?? "children"}>
      {group.labelKey ? <NavGroupLabel labelKey={group.labelKey} /> : null}
      {group.children.map((child) => (
        <MobileDrawerSubItem
          hideLive={hideLive}
          item={child}
          key={child.path}
          onSelect={onSelect}
          pathname={pathname}
        />
      ))}
    </Fragment>
  ))
}
