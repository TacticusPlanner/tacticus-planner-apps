import { findActiveChild, matchesNavPath } from "./find-active-child"
import type { NavItem, NavSubItem } from "./nav-items"

/**
 * Finds the top-level section the current route belongs to, plus its specific child page when the
 * route matches one (the most specific match, see `findActiveChild`) - shared by `pageTitle`
 * (always the section) and `pageDescription` (the child's own description when one is active, else
 * the section's).
 */
export function resolveActiveNavigation(
  navItems: NavItem[],
  pathname: string
): { activeItem: NavItem | undefined; activeChild: NavSubItem | undefined } {
  const activeItem = navItems.find((item) =>
    matchesNavPath(pathname, item.path)
  )
  const activeChild = findActiveChild(activeItem?.children, pathname)

  return { activeItem, activeChild }
}
