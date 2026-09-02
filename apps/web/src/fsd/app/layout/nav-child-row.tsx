import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { NavSubItem } from "./nav-items"

export function NavChildRow({
  child,
  className,
  isActive,
  onSelect,
}: {
  child: NavSubItem
  className?: string
  isActive: boolean
  onSelect?: () => void
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-9 flex-col rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={onSelect}
      to={child.path}
    >
      <span className="truncate">{t(child.labelKey)}</span>
      <span className="truncate text-xs font-normal opacity-80">
        {t(child.descriptionKey)}
      </span>
    </Link>
  )
}
