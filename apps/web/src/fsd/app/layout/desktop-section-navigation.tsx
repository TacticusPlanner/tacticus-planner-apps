import { Link, useLocation } from "react-router"
import { PanelLeftClose } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { CommandShortcut } from "@workspace/ui/components/command"
import { cn } from "@workspace/ui/lib/utils"

import { NavLiveDot } from "./nav-live-dot"
import type { NavItem } from "./nav-items"
import { sectionShortcut } from "./section-shortcut"

const LIST_ID = "desktop-section-navigation-list"

/**
 * Persistent menu of the active section's child pages: the section name, a collapse button, and
 * the child links. Collapsing removes the whole column (the page header then shows the reopen
 * button and breadcrumb - see DesktopSectionHeader), so its links also leave the tab order.
 */
export function DesktopSectionNavigation({
  expanded,
  item,
  onExpandedChange,
}: {
  expanded: boolean
  item: NavItem
  onExpandedChange: (expanded: boolean) => void
}) {
  // Also declares the `dailies` namespace: Dailies' child labels live there instead of
  // `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()

  const label = t(item.labelKey)
  const shortcut = sectionShortcut()
  const toggleLabel = t("nav.collapseSection", { section: label })

  // The column animates its width like the main rail (200ms linear, none for reduced motion). It
  // stays mounted so it can slide closed: `inert` and (after the transition) `invisible` take the
  // links out of the tab order and the accessibility tree, and the test id / toggle id move to the
  // expanded panel only, so the tour and focus handoff target the reopen button while collapsed.
  return (
    <div
      aria-hidden={!expanded}
      className={cn(
        "sticky top-12 h-[calc(100svh-3rem)] shrink-0 self-start overflow-hidden transition-[width,visibility] duration-200 ease-linear motion-reduce:transition-none",
        expanded ? "w-52" : "invisible w-0"
      )}
      data-testid="desktop-section-column"
      inert={!expanded}
    >
      <nav
        aria-label={t("nav.sectionNavigation", { section: label })}
        className="flex h-full w-52 flex-col overflow-y-auto border-r bg-section-menu"
        data-testid={expanded ? "desktop-section-navigation" : undefined}
      >
        {/* Same top offset as the page header (pt-4) so the section name and the page title share a
          vertical center; the whole row is the collapse button, with its icon at the right. */}
        <div className="px-2 pt-4 pb-1">
          <Button
            aria-controls={LIST_ID}
            aria-expanded={expanded}
            aria-keyshortcuts={shortcut.aria}
            aria-label={toggleLabel}
            className="h-8 w-full justify-between px-2"
            data-testid={expanded ? "desktop-section-toggle" : undefined}
            onClick={() => onExpandedChange(false)}
            title={`${toggleLabel} (${shortcut.hint})`}
            variant="ghost"
          >
            <span className="truncate text-sm font-semibold">{label}</span>
            <span className="flex shrink-0 items-center gap-2">
              <CommandShortcut
                aria-hidden="true"
                data-testid="section-shortcut-hint"
              >
                {shortcut.hint}
              </CommandShortcut>
              <PanelLeftClose />
            </span>
          </Button>
        </div>
        <ul className="flex flex-col gap-0.5 px-2 pb-2" id={LIST_ID}>
          {item.children?.map((child) => {
            const isActive =
              pathname === child.path || pathname.startsWith(child.path + "/")

            return (
              <li key={child.path}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-medium text-accent-foreground shadow-[inset_3px_0_0_0_var(--accent-foreground)]"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={t(child.labelKey)}
                  to={child.path}
                >
                  <span className="min-w-0 truncate">{t(child.labelKey)}</span>
                  <NavLiveDot item={child} />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
