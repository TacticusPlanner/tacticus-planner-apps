import {
  subItemDescription,
  subItemLabel,
  type NavItem,
  type NavSubItem,
  type NavTranslate,
} from "./nav-items"

function matches(
  item: NavItem | NavSubItem,
  normalizedQuery: string,
  getLabel: NavTranslate
): boolean {
  // A section always carries keys; a child may be data-driven (see nav-items.ts).
  const label =
    "icon" in item ? getLabel(item.labelKey) : subItemLabel(getLabel, item)
  const description =
    "icon" in item
      ? getLabel(item.descriptionKey)
      : subItemDescription(getLabel, item)
  return (
    label.toLocaleLowerCase().includes(normalizedQuery) ||
    description.toLocaleLowerCase().includes(normalizedQuery)
  )
}

export function filterNavigationItems(
  items: NavItem[],
  query: string,
  getLabel: NavTranslate
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
