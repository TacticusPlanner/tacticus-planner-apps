import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { NavLiveDot } from "./nav-live-dot"
import { subItemDescription, subItemLabel, type NavSubItem } from "./nav-items"

export function MobileDrawerSubItem({
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
        "flex min-h-10 flex-col justify-center rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground shadow-[inset_3px_0_0_0_var(--accent-foreground)]"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onSelect}
      to={item.path}
    >
      <span className="flex items-center">
        <span className="truncate">{subItemLabel(t, item)}</span>
        <NavLiveDot hidden={hideLive} item={item} />
      </span>
      <span className="truncate text-xs font-normal opacity-80">
        {subItemDescription(t, item)}
      </span>
    </Link>
  )
}
