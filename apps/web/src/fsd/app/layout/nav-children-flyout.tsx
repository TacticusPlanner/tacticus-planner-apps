import { useTranslation } from "react-i18next"

import { NavChildRow } from "./nav-child-row"
import type { NavItem } from "./nav-items"

/**
 * The sidebar's per-section flyout content: the section's own title as a quiet, non-interactive
 * label (matching the sidebar's own group-label treatment), followed by one row per child page.
 */
export function NavChildrenFlyout({
  item,
  onSelect,
  pathname,
}: {
  item: NavItem
  onSelect?: () => void
  pathname: string
}) {
  // Also declares the `dailies` namespace: Dailies' child labels live there instead of
  // `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies"])
  const children = item.children ?? []

  return (
    <div className="flex flex-col gap-1" data-testid="nav-children-flyout">
      <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-muted-foreground">
        {t(item.labelKey)}
      </div>
      {children.map((child) => (
        <NavChildRow
          key={child.path}
          child={child}
          isActive={
            pathname === child.path || pathname.startsWith(child.path + "/")
          }
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
