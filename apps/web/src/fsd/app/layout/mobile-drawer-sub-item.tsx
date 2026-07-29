import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { NavSubItem } from "./nav-items"

export function MobileDrawerSubItem({
  item,
  onSelect,
  pathname,
}: {
  item: NavSubItem
  onSelect: () => void
  pathname: string
}) {
  const { t } = useTranslation()
  const isActive = pathname === item.path

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onSelect}
      to={item.path}
    >
      {t(item.labelKey)}
    </Link>
  )
}
