import { useLocation } from "react-router"
import { PanelLeftOpen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { findActiveChild } from "./find-active-child"
import { subItemLabel, type NavItem } from "./nav-items"
import { sectionShortcut } from "./section-shortcut"

/**
 * Renders the desktop header's title row. The title is the active page's own name (the child's
 * label for a section with children, else the section's label) - the section menu beside the page
 * already names the section. Only while that menu is collapsed does the header add a reopen
 * button and a plain "{Section} › {Active child}" breadcrumb in its place. See design.md's
 * "Section menu header and collapsed header" decision.
 */
export function DesktopSectionHeader({
  item,
  onSectionExpandedChange,
  sectionExpanded = true,
  title,
}: {
  item: NavItem | undefined
  onSectionExpandedChange?: (expanded: boolean) => void
  sectionExpanded?: boolean
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

  const activeChild = findActiveChild(children, pathname) ?? children[0]
  const childLabel = subItemLabel(t, activeChild)
  const heading = (
    <h1
      className="truncate text-2xl font-semibold tracking-tight"
      data-testid="section-header-title"
    >
      {childLabel}
    </h1>
  )

  if (sectionExpanded) return heading

  const shortcut = sectionShortcut()
  const toggleLabel = t("nav.expandSection", { section: title })

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button
        aria-expanded={false}
        aria-keyshortcuts={shortcut.aria}
        aria-label={toggleLabel}
        data-testid="desktop-section-toggle"
        onClick={() => onSectionExpandedChange?.(true)}
        size="icon-sm"
        title={`${toggleLabel} (${shortcut.hint})`}
        variant="ghost"
      >
        <PanelLeftOpen />
      </Button>
      <nav
        aria-label={t("nav.breadcrumb")}
        className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"
        data-testid="section-header-breadcrumb"
      >
        <span>{title}</span>
        <span aria-hidden="true">›</span>
      </nav>
      {heading}
    </div>
  )
}
