import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { NavLiveDot } from "./nav-live-dot"
import type { NavItem } from "./nav-items"

export function MobileNavLink({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const isCurrent = pathname === item.path
  const isActive = isCurrent || pathname.startsWith(item.path + "/")

  return (
    <Link
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium transition-colors",
        isActive
          ? "text-primary shadow-[inset_0_2px_0_0_var(--primary)]"
          : "text-muted-foreground hover:text-foreground"
      )}
      data-testid={`mobile-nav-${item.path.slice(1)}`}
      to={item.path}
    >
      <span className="relative flex">
        <item.icon className="size-5" />
        <NavLiveDot corner item={item} />
      </span>
      <span>{t(item.labelKey)}</span>
    </Link>
  )
}
