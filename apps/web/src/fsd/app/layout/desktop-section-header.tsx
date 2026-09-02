import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"

import type { NavItem } from "./nav-items"

/**
 * Renders the desktop header's title row: the active top-level section's own name, plus - when
 * it has child pages - a plain, non-interactive "{Section} › {Active child}" breadcrumb. Neither
 * segment is a link; switching to a different child now happens only through the sidebar's own
 * flyout (see nav-children-flyout.tsx), navigation search, or a direct link - see design.md's
 * "Desktop header shows a static section/child breadcrumb" decision.
 */
export function DesktopSectionHeader({
  item,
  title,
}: {
  item: NavItem | undefined
  title: string | undefined
}) {
  // Also declares the `dailies` namespace: Dailies' child labels live there instead of
  // `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()

  if (!title) return <span />

  const children = item?.children
  if (!children?.length) {
    return (
      <h1
        className="truncate text-2xl font-semibold tracking-tight"
        data-testid="section-header-title"
      >
        {title}
      </h1>
    )
  }

  const activeChild =
    children.find(
      (child) =>
        pathname === child.path || pathname.startsWith(child.path + "/")
    ) ?? children[0]

  return (
    <h1
      className="flex min-w-0 items-center gap-1.5 text-2xl font-semibold tracking-tight"
      data-testid="section-header-title"
    >
      <span className="truncate">{title}</span>
      <span aria-hidden="true" className="shrink-0 text-muted-foreground">
        ›
      </span>
      <span className="truncate">{t(activeChild.labelKey)}</span>
    </h1>
  )
}
