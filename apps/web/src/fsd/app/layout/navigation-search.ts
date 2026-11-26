import { subItemDescription, subItemLabel } from "./nav-items"
import type {
  NavGroupLabelKey,
  NavItem,
  NavSubItem,
  NavTranslate,
} from "./nav-items"
import { foldText, matchTier } from "./match-tier"
import type { MatchFields } from "./match-tier"
import type { QuickAction } from "./quick-actions"
import { isGoalUnit, rankEntities } from "./entity-search"
import type { EntityKind, SearchEntity } from "./entity-search"

export { matchTier } from "./match-tier"

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
  /** A game entity's page (a unit, NPC, raid boss or Legendary Event). */
  | { kind: "entity"; key: string; entity: SearchEntity }
  /** Opens the new goal form with `unit` selected (a character or Machine of War). */
  | { kind: "unitGoal"; key: string; unit: SearchEntity }
  /** Opens Collection filtered by the query. */
  | { kind: "collectionSearch"; key: string; query: string; to: string }

type NavigationGroupId = "recent" | "actions" | "pages" | EntityKind

export interface NavigationGroup {
  id: NavigationGroupId
  entries: NavigationEntry[]
}

function normalize(query: string): string {
  return foldText(query.trim())
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
    case "entity":
    case "unitGoal": {
      const entity = entry.kind === "entity" ? entry.entity : entry.unit
      return {
        label: entity.name,
        description: "",
        keywords: entity.searchNames,
        context: [],
      }
    }
    case "collectionSearch": {
      return { label: entry.query, description: "", keywords: [], context: [] }
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
      (entry) =>
        (entry.kind === "section" || entry.kind === "child") &&
        entry.item.path === path
    )
    return page ? [{ ...page, key: `recent:${page.key}` }] : []
  })
}

/** Where navigation search reaches beyond pages and fixed actions (see `buildNavigationGroups`). */
export interface EntitySearchOptions {
  /** Game entities to match, from the catalog. */
  entities?: readonly SearchEntity[]
  /** The visitor can create goals, so a matched unit also offers "Create goal for <unit>". */
  canCreateGoals?: boolean
  /** Collection's path, when the visitor can open it: a matched unit also offers searching it. */
  collectionPath?: string
  /** The unit whose page is open: with no query, "Create goal for <unit>" leads the actions. */
  contextUnit?: SearchEntity
}

const unitGoalEntry = (unit: SearchEntity): NavigationEntry => ({
  kind: "unitGoal",
  key: `unit-goal:${unit.kind}:${unit.id}`,
  unit,
})

/**
 * What navigation search lists for a query. With no query: the recent pages, "Create goal for
 * <unit>" on a unit's page, every action that is not search-only, then the page tree in menu
 * order. With one: the matching actions, pages and game entities, each group ranked as one flat
 * list (entities at most 5 per kind), and the group holding the better match first (actions, then
 * pages, then entities by kind on a tie). The best matching unit's group ends with "Create goal
 * for <unit>" and "Find '<query>' in Collection". Groups with no match are left
 * out, so an empty result is an empty array.
 */
export function buildNavigationGroups({
  actions,
  canCreateGoals = false,
  collectionPath,
  contextUnit,
  entities = [],
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
} & EntitySearchOptions): NavigationGroup[] {
  const actionEntries: NavigationEntry[] = actions.map((action) => ({
    kind: "action",
    key: `action:${action.id}`,
    action,
  }))
  const pages = pageEntries(items, t, getEntryPath)
  const normalized = normalize(query)

  if (!normalized) {
    const restingActions = actionEntries.filter(
      (entry) => entry.kind === "action" && !entry.action.searchOnly
    )
    return [
      { id: "recent" as const, entries: recentEntries(pages, recentPaths) },
      {
        id: "actions" as const,
        entries:
          canCreateGoals && contextUnit
            ? [unitGoalEntry(contextUnit), ...restingActions]
            : restingActions,
      },
      { id: "pages" as const, entries: pages },
    ].filter((group) => group.entries.length > 0)
  }

  const rankedActions = rank(actionEntries, normalized, t)
  const rankedPages = rank(pages, normalized, t)
  // A page the menu already lists (a running LE) is not listed again as an entity.
  const pagePaths = new Set(
    pages.flatMap((entry) =>
      entry.kind === "section" || entry.kind === "child"
        ? [entry.item.path]
        : []
    )
  )
  const rankedEntities = rankEntities(
    entities.filter((entity) => !pagePaths.has(entity.to)),
    normalized
  )

  // The best matching unit, characters before Machines of War on equal matches.
  const bestUnit = rankedEntities
    .flatMap((group) => group.entries)
    .filter(({ entity }) => isGoalUnit(entity))
    .reduce<{ entity: SearchEntity; tier: number } | undefined>(
      (best, entry) => (best && best.tier <= entry.tier ? best : entry),
      undefined
    )
  const entityGroups = rankedEntities.map(({ kind, entries }) => ({
    id: kind,
    entries: entries.map(({ entity }): NavigationEntry => ({
      kind: "entity",
      key: `entity:${entity.kind}:${entity.id}`,
      entity,
    })),
    best: entries[0]?.tier ?? Number.POSITIVE_INFINITY,
  }))
  // The best unit's group ends with what to do with it: a goal for it, and Collection searched.
  const bestUnitGroup = bestUnit
    ? entityGroups.find((group) => group.id === bestUnit.entity.kind)
    : undefined
  if (bestUnit && bestUnitGroup) {
    if (canCreateGoals)
      bestUnitGroup.entries.push(unitGoalEntry(bestUnit.entity))
    if (collectionPath !== undefined) {
      bestUnitGroup.entries.push({
        kind: "collectionSearch",
        key: "collection-search",
        query: query.trim(),
        to: `${collectionPath}?${new URLSearchParams({ q: query.trim() }).toString()}`,
      })
    }
  }

  const groups = [
    { id: "actions" as const, ...rankedActions },
    { id: "pages" as const, ...rankedPages },
    ...entityGroups,
  ].filter((group) => group.entries.length > 0)
  groups.sort((a, b) => a.best - b.best)
  return groups.map(({ id, entries }) => ({ id, entries }))
}
