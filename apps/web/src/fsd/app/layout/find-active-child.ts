import type { NavSubItem } from "./nav-items"

/** Whether `pathname` is `itemPath` or nested below it. */
export function matchesNavPath(pathname: string, itemPath: string): boolean {
  return pathname === itemPath || pathname.startsWith(itemPath + "/")
}

/**
 * The child page the route belongs to: the matching child with the most specific path, so a
 * landing child at the section root (All events at `/legendary-events`) never shadows a sibling
 * nested below it (`/legendary-events/votanUthar`), whatever the children's order.
 */
export function findActiveChild<Child extends Pick<NavSubItem, "path">>(
  children: readonly Child[] | undefined,
  pathname: string
): Child | undefined {
  let active: Child | undefined
  for (const child of children ?? []) {
    if (
      matchesNavPath(pathname, child.path) &&
      (!active || child.path.length > active.path.length)
    ) {
      active = child
    }
  }
  return active
}
