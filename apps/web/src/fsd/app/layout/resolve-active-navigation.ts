import type { NavItem, NavSubItem } from "./nav-items"

function matchesPath(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(itemPath + "/")
}

/**
 * Finds the top-level section the current route belongs to, plus its specific child page when the
 * route matches one - shared by `pageTitle` (always the section) and `pageDescription` (the child's
 * own description when one is active, else the section's).
 */
export function resolveActiveNavigation(
  navItems: NavItem[],
  pathname: string
): { activeItem: NavItem | undefined; activeChild: NavSubItem | undefined } {
  const activeItem = navItems.find((item) => matchesPath(pathname, item.path))
  const activeChild = activeItem?.children?.find((child) =>
    matchesPath(pathname, child.path)
  )

  return { activeItem, activeChild }
}
