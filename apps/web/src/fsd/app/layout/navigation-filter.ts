import type { NavItem } from "./nav-items"

export function filterNavigationItems(
  items: NavItem[],
  query: string,
  getLabel: (key: NavItem["labelKey"]) => string
): NavItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) return items

  return items.flatMap((item) => {
    const parentMatches = getLabel(item.labelKey)
      .toLocaleLowerCase()
      .includes(normalizedQuery)
    const children =
      item.children?.filter(
        (child) =>
          parentMatches ||
          getLabel(child.labelKey).toLocaleLowerCase().includes(normalizedQuery)
      ) ?? []

    return parentMatches || children.length > 0 ? [{ ...item, children }] : []
  })
}
