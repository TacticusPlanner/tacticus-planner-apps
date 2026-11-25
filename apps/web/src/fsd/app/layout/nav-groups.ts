import { findActiveChild } from "./find-active-child"
import type { NavGroupLabelKey, NavSubItem } from "./nav-items"

type Grouped = Pick<NavSubItem, "path" | "groupLabelKey">

/** A run of a section's children under one group label (none for an ungrouped section). */
export interface NavChildGroup<Child extends Grouped> {
  labelKey: NavGroupLabelKey | undefined
  children: Child[]
}

/** The children in runs of the same group, in their order: what the section menu and the drawer
 *  list, each run under its label. */
export function groupNavChildren<Child extends Grouped>(
  children: readonly Child[]
): NavChildGroup<Child>[] {
  const groups: NavChildGroup<Child>[] = []
  for (const child of children) {
    const last = groups.at(-1)
    if (last && last.labelKey === child.groupLabelKey) {
      last.children.push(child)
    } else {
      groups.push({ labelKey: child.groupLabelKey, children: [child] })
    }
  }
  return groups
}

/** The children the page tabs list on `pathname`: the active child's group (the first child's
 *  when none is active), or every child of an ungrouped section. */
export function childrenOfActiveGroup<Child extends Grouped>(
  children: readonly Child[],
  pathname: string
): Child[] {
  const active = findActiveChild(children, pathname) ?? children[0]
  return children.filter(
    (child) => child.groupLabelKey === active?.groupLabelKey
  )
}
