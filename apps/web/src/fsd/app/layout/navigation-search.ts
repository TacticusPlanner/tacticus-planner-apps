import { subItemDescription, subItemLabel } from "./nav-items"
import type {
  NavGroupLabelKey,
  NavItem,
  NavSubItem,
  NavTranslate,
} from "./nav-items"
import type { QuickAction } from "./quick-actions"

/** One selectable row of navigation search. `key` is unique across the whole list. */
export type NavigationEntry =
  | { kind: "action"; key: string; action: QuickAction }
  | {
      kind: "section"
      key: string
      item: NavItem
      /** Where the row goes: the section's entry path (its last-visited child on desktop). */
      to: string
    }
  | {
      kind: "child"
      key: string
      item: NavSubItem
      section: NavItem
      to: string
      /** The group label shown above this child in the tree (the first child of a group). */
      groupLabelKey?: NavGroupLabelKey
      /** Muted text after the label in ranked results: the child's group, else its section. */
      crumb: string
    }

type NavigationGroupId = "recent" | "actions" | "pages"

export interface NavigationGroup {
  id: NavigationGroupId
  entries: NavigationEntry[]
}

/** How well a query matches one row; lower is better, `undefined` is no match. */
type MatchTier = number

interface MatchFields {
  label: string
  description: string
  keywords: readonly string[]
  /** Labels of the places the row sits in (its section, its group). */
  context: readonly string[]
}

const WORD_SPLIT = /[\s\-–—/·:,.()]+/u

function words(text: string): string[] {
  return text.toLocaleLowerCase().split(WORD_SPLIT).filter(Boolean)
}

/**
 * Ranks one row against a trimmed, lowercased query:
 * 0 label starts with it, 1 a label word starts with it, 2 a keyword starts with it,
 * 3 a description word starts with it, 4 a section/group word starts with it (so "dailies" also
 * lists Dailies' pages), 5 every word of a multi-word query starts a word somewhere in the row,
 * 6 a 3+ character query appears anywhere in the label or description.
 */
export function matchTier(
  query: string,
  fields: MatchFields
): MatchTier | undefined {
  const label = fields.label.toLocaleLowerCase()
  if (label.startsWith(query)) return 0
  const labelWords = words(fields.label)
  if (labelWords.some((word) => word.startsWith(query))) return 1
  const keywords = fields.keywords.map((keyword) => keyword.toLocaleLowerCase())
  if (keywords.some((keyword) => keyword.startsWith(query))) return 2
  const descriptionWords = words(fields.description)
  if (descriptionWords.some((word) => word.startsWith(query))) return 3
  const contextWords = fields.context.flatMap(words)
  if (contextWords.some((word) => word.startsWith(query))) return 4

  const tokens = words(query)
  if (tokens.length > 1) {
    const all = [
      ...labelWords,
      ...keywords.flatMap(words),
      ...descriptionWords,
      ...contextWords,
    ]
    if (tokens.every((token) => all.some((word) => word.startsWith(token))))
      return 5
  }
  if (
    query.length >= 3 &&
    (label.includes(query) ||
      fields.description.toLocaleLowerCase().includes(query))
  )
    return 6
  return undefined
}

function normalize(query: string): string {
  return query.trim().toLocaleLowerCase()
}

/** Every page row in menu order: each section, then its children (in their groups). */
function pageEntries(
  items: NavItem[],
  t: NavTranslate,
  getEntryPath: (item: NavItem) => string
): NavigationEntry[] {
  return items.flatMap((section): NavigationEntry[] => {
    let previousGroup: NavGroupLabelKey | undefined
    const children = (section.children ?? []).map((child): NavigationEntry => {
      const startsGroup =
        child.groupLabelKey !== undefined &&
        child.groupLabelKey !== previousGroup
      previousGroup = child.groupLabelKey
      return {
        kind: "child",
        key: `child:${child.path}`,
        item: child,
        section,
        to: child.path,
        groupLabelKey: startsGroup ? child.groupLabelKey : undefined,
        crumb: child.groupLabelKey
          ? t(child.groupLabelKey)
          : t(section.labelKey),
      }
    })
    return [
      {
        kind: "section",
        key: `section:${section.path}`,
        item: section,
        to: getEntryPath(section),
      },
      ...children,
    ]
  })
}

function fieldsOf(entry: NavigationEntry, t: NavTranslate): MatchFields {
  switch (entry.kind) {
    case "action": {
      return {
        label: entry.action.label,
        description: entry.action.description,
        keywords: entry.action.keywords,
        context: [],
      }
    }
    case "section": {
      return {
        label: t(entry.item.labelKey),
        description: t(entry.item.descriptionKey),
        keywords: entry.item.keywords ?? [],
        context: [],
      }
    }
    case "child": {
      return {
        label: subItemLabel(t, entry.item),
        description: subItemDescription(t, entry.item),
        keywords: entry.item.keywords ?? [],
        context: [
          t(entry.section.labelKey),
          ...(entry.item.groupLabelKey ? [t(entry.item.groupLabelKey)] : []),
        ],
      }
    }
  }
}

/** Keeps the entries that match, best match first; equal matches keep their menu order. */
function rank(
  entries: NavigationEntry[],
  query: string,
  t: NavTranslate
): { entries: NavigationEntry[]; best: number } {
  const scored = entries.flatMap((entry, index) => {
    const tier = matchTier(query, fieldsOf(entry, t))
    return tier === undefined ? [] : [{ entry, index, tier }]
  })
  scored.sort((a, b) =>
    a.tier === b.tier ? a.index - b.index : a.tier - b.tier
  )
  return {
    entries: scored.map(({ entry }) => entry),
    best: scored[0]?.tier ?? Number.POSITIVE_INFINITY,
  }
}

/** The pages at `paths` (most recent first), as rows of their own; paths no longer listed (a page
 *  that is gone or hidden from this visitor) are skipped. */
function recentEntries(
  pages: NavigationEntry[],
  paths: readonly string[]
): NavigationEntry[] {
  return paths.flatMap((path): NavigationEntry[] => {
    const page = pages.find(
      (entry) => entry.kind !== "action" && entry.item.path === path
    )
    return page ? [{ ...page, key: `recent:${page.key}` }] : []
  })
}

/**
 * What navigation search lists for a query. With no query: the recent pages, every action that is
 * not search-only, then the page tree in menu order. With one: the matching actions and the
 * matching pages, each ranked, as one flat list per group, and the group holding the better match
 * first (actions first on a tie). Groups with no match are left out, so an empty result is an
 * empty array.
 */
export function buildNavigationGroups({
  actions,
  getEntryPath,
  items,
  query,
  recentPaths = [],
  t,
}: {
  actions: QuickAction[]
  getEntryPath: (item: NavItem) => string
  items: NavItem[]
  query: string
  /** Recently visited page paths, most recent first, already without the current page. */
  recentPaths?: readonly string[]
  t: NavTranslate
}): NavigationGroup[] {
  const actionEntries: NavigationEntry[] = actions.map((action) => ({
    kind: "action",
    key: `action:${action.id}`,
    action,
  }))
  const pages = pageEntries(items, t, getEntryPath)
  const normalized = normalize(query)

  if (!normalized) {
    return [
      { id: "recent" as const, entries: recentEntries(pages, recentPaths) },
      {
        id: "actions" as const,
        entries: actionEntries.filter(
          (entry) => entry.kind === "action" && !entry.action.searchOnly
        ),
      },
      { id: "pages" as const, entries: pages },
    ].filter((group) => group.entries.length > 0)
  }

  const rankedActions = rank(actionEntries, normalized, t)
  const rankedPages = rank(pages, normalized, t)
  const groups = [
    { id: "actions" as const, ...rankedActions },
    { id: "pages" as const, ...rankedPages },
  ].filter((group) => group.entries.length > 0)
  groups.sort((a, b) => a.best - b.best)
  return groups.map(({ id, entries }) => ({ id, entries }))
}
