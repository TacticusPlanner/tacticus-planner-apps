import type { NavItem, NavSubItem } from "./nav-items"

type LabelOrDescriptionKey = NavItem["labelKey"] | NavItem["descriptionKey"]

function matches(
  item: NavItem | NavSubItem,
  normalizedQuery: string,
  getLabel: (key: LabelOrDescriptionKey) => string
): boolean {
  return (
    getLabel(item.labelKey).toLocaleLowerCase().includes(normalizedQuery) ||
    getLabel(item.descriptionKey).toLocaleLowerCase().includes(normalizedQuery)
  )
}

export function filterNavigationItems(
  items: NavItem[],
  query: string,
  getLabel: (key: LabelOrDescriptionKey) => string
): NavItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) return items

  return items.flatMap((item) => {
    const parentMatches = matches(item, normalizedQuery, getLabel)
    const children =
      item.children?.filter(
        (child) => parentMatches || matches(child, normalizedQuery, getLabel)
      ) ?? []

    return parentMatches || children.length > 0 ? [{ ...item, children }] : []
  })
}
