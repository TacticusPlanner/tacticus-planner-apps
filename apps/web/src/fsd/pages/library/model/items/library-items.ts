import type { Rarity } from "@workspace/game-domain"
import { rarityOrder, rarityRank } from "@workspace/game-domain"

import { ITEM_SLOT_TYPES, itemSlotRank } from "@/shared/equipment"
import {
  firstDifference,
  readFlag,
  readList,
  readOneOf,
  writeUrlQuery,
} from "@/shared/lib"

/** What the Library's Items pages read of a catalog equipment record. */
export type LibraryItem = {
  id: string
  name: string
  type: string
  rarity: Rarity
  isRelic: boolean
  allowedUnits: readonly string[]
  allowedFactions: readonly string[]
}

export const LIBRARY_ITEM_GROUPS = ["none", "slot", "rarity"] as const
export type LibraryItemGroup = (typeof LIBRARY_ITEM_GROUPS)[number]

/** The Items list's search, filters and grouping, carried in the URL. */
export type LibraryItemsQuery = {
  q: string
  rarity: Rarity[]
  slot: string[]
  faction: string[]
  /** Relics only. */
  relic: boolean
  group: LibraryItemGroup
}

export const DEFAULT_LIBRARY_ITEMS_QUERY: LibraryItemsQuery = {
  q: "",
  rarity: [],
  slot: [],
  faction: [],
  relic: false,
  group: "slot",
}

export const CLEARED_LIBRARY_ITEM_FILTERS: Partial<LibraryItemsQuery> = {
  q: "",
  rarity: [],
  slot: [],
  faction: [],
  relic: false,
}

export function readLibraryItemsQuery(
  params: URLSearchParams
): LibraryItemsQuery {
  return {
    q: params.get("q") ?? "",
    rarity: readList(params, "rarity").filter((value): value is Rarity =>
      (rarityOrder as readonly string[]).includes(value)
    ),
    slot: readList(params, "slot").filter((value) =>
      (ITEM_SLOT_TYPES as readonly string[]).includes(value)
    ),
    faction: readList(params, "faction"),
    relic: readFlag(params, "relic"),
    group: readOneOf(params.get("group"), LIBRARY_ITEM_GROUPS, "slot"),
  }
}

export const writeLibraryItemsQuery = (
  params: URLSearchParams,
  patch: Partial<LibraryItemsQuery>
): URLSearchParams => writeUrlQuery(params, patch, DEFAULT_LIBRARY_ITEMS_QUERY)

/** How many of the Filters panel's fields are set: the Relics only switch, and each field with a
 *  value (the search is counted apart). */
export const activeLibraryItemFilterCount = (query: LibraryItemsQuery) =>
  [
    query.relic,
    ...[query.rarity, query.slot, query.faction].map(
      (values) => values.length > 0
    ),
  ].filter(Boolean).length

export const libraryItemsQueryNarrows = (query: LibraryItemsQuery) =>
  query.q.trim() !== "" || activeLibraryItemFilterCount(query) > 0

/** The factions an item is for: its own list, or the factions of the characters it is unique to. */
function libraryItemFactions(
  item: LibraryItem,
  factionOf: (characterId: string) => string | undefined
): string[] {
  if (item.allowedFactions.length > 0) return [...item.allowedFactions]
  return [
    ...new Set(
      item.allowedUnits
        .map(factionOf)
        .filter((faction): faction is string => faction !== undefined)
    ),
  ]
}

/** Slot type, then highest rarity, then name: the order the list and Previous / Next follow. */
export function sortLibraryItems<Item extends LibraryItem>(
  items: readonly Item[],
  nameOf: (item: Item) => string,
  locale: string
): Item[] {
  return items.toSorted((a, b) =>
    firstDifference(
      itemSlotRank(a.type) - itemSlotRank(b.type),
      rarityRank(b.rarity) - rarityRank(a.rarity),
      nameOf(a).localeCompare(nameOf(b), locale)
    )
  )
}

/** The items the query keeps. */
export function filterLibraryItems<Item extends LibraryItem>(
  items: readonly Item[],
  query: LibraryItemsQuery,
  {
    nameOf,
    factionOf,
    locale,
  }: {
    nameOf: (item: Item) => string
    factionOf: (characterId: string) => string | undefined
    locale: string
  }
): Item[] {
  const search = query.q.trim().toLocaleLowerCase(locale)
  return items.filter(
    (item) =>
      (search === "" ||
        nameOf(item).toLocaleLowerCase(locale).includes(search)) &&
      (!query.relic || item.isRelic) &&
      (query.rarity.length === 0 || query.rarity.includes(item.rarity)) &&
      (query.slot.length === 0 || query.slot.includes(item.type)) &&
      (query.faction.length === 0 ||
        libraryItemFactions(item, factionOf).some((faction) =>
          query.faction.includes(faction)
        ))
  )
}

/** Items in groups by slot or rarity (keeping their order), or one group. */
export function groupLibraryItems<Item extends LibraryItem>(
  items: readonly Item[],
  group: LibraryItemGroup
): { key: string; items: Item[] }[] {
  if (group === "none")
    return items.length > 0 ? [{ key: "all", items: [...items] }] : []
  const groups = new Map<string, Item[]>()
  for (const item of items) {
    const key = group === "slot" ? item.type : item.rarity
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups]
    .map(([key, entries]) => ({ key, items: entries }))
    .toSorted((a, b) =>
      group === "slot"
        ? itemSlotRank(a.key) - itemSlotRank(b.key)
        : rarityRank(b.key as Rarity) - rarityRank(a.key as Rarity)
    )
}

/** One row of an item's cost ladder: what reaching the level costs, and the running totals. */
export type LadderRow = {
  level: number
  gold: number
  salvage: number
  mythicSalvage: number
  totalGold: number
  totalSalvage: number
  totalMythicSalvage: number
}

/** The item's upgrade ladder, level by level: level 1's salvage is what a found copy is worth. */
export function costLadder(item: {
  upgradeLevels: readonly {
    goldCost: number
    salvageCost: number
    mythicSalvageCost: number
  }[]
}): LadderRow[] {
  let totalGold = 0
  let totalSalvage = 0
  let totalMythicSalvage = 0
  return item.upgradeLevels.map((step, index) => {
    totalGold += step.goldCost
    totalSalvage += step.salvageCost
    totalMythicSalvage += step.mythicSalvageCost
    return {
      level: index + 1,
      gold: step.goldCost,
      salvage: step.salvageCost,
      mythicSalvage: step.mythicSalvageCost,
      totalGold,
      totalSalvage,
      totalMythicSalvage,
    }
  })
}

/** How many factions the items name in all: an item listing that many is for everyone. */
export const allFactionCount = (
  items: readonly { allowedFactions: readonly string[] }[]
): number => new Set(items.flatMap((item) => item.allowedFactions)).size

/** The list's search and filters, carried to an item page in router history state so its Back
 *  button returns to the same list (and never shows in a shared URL). */
type ItemsOriginState = { itemsListSearch: string }

export const itemsOriginState = (search: string): ItemsOriginState => ({
  itemsListSearch: search,
})

/** The list's `?…` search from an item page's history state; "" when there is none. History state
 *  is untrusted: another page or an older build may have written it. */
export function readItemsListSearch(state: unknown): string {
  const search = (state as { itemsListSearch?: unknown } | null | undefined)
    ?.itemsListSearch
  return typeof search === "string" && search.startsWith("?") ? search : ""
}
