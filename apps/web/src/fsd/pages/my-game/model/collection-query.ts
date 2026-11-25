import {
  activeUnitFilterCount,
  defaultUnitFilters,
} from "@/features/unit-filters"
import type { UnitFilters } from "@/features/unit-filters"

export const collectionSorts = [
  "rarity",
  "rank",
  "abilities",
  "shards",
  "power",
] as const
export type CollectionSort = (typeof collectionSorts)[number]
export const defaultCollectionSort: CollectionSort = "rarity"

/** How the listed units are laid out; Table and Showcase join this list later. */
export const collectionLayouts = ["cards", "roster"] as const
export type CollectionLayout = (typeof collectionLayouts)[number]
export const defaultCollectionLayout: CollectionLayout = "cards"

/** Whether units are grouped by faction or listed together across factions. */
const collectionGroupings = ["faction", "none"] as const
export type CollectionGrouping = (typeof collectionGroupings)[number]
export const defaultCollectionGrouping: CollectionGrouping = "faction"

export const collectionQuickFilters = [
  "readyToRankUp",
  "needToAscend",
  "canPromote",
  "canAscend",
  "needToLevel",
  "blueStarReady",
  "missingEquipment",
  "abilitiesBehindLevel",
] as const
export type CollectionQuickFilter = (typeof collectionQuickFilters)[number]

/** What the Collection toolbar asks of the list; `null`/empty means "not set". */
export interface CollectionQuery extends UnitFilters {
  search: string
  /** Lists owned units only: a display setting, kept in `?owned=owned`; the counts are unchanged. */
  hideUnowned: boolean
  quick: CollectionQuickFilter | null
  sort: CollectionSort
  /** The layout; like the sort it is not a filter and Clear filters keeps it. */
  view: CollectionLayout
  /** Grouped by faction, or one list across factions; not a filter either. */
  group: CollectionGrouping
}

export const defaultCollectionQuery: CollectionQuery = {
  ...defaultUnitFilters,
  search: "",
  hideUnowned: false,
  quick: null,
  sort: defaultCollectionSort,
  view: defaultCollectionLayout,
  group: defaultCollectionGrouping,
}

const includes =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value)

export const isCollectionSort = includes(collectionSorts)
export const isCollectionLayout = includes(collectionLayouts)
export const isCollectionGrouping = includes(collectionGroupings)
export const isCollectionQuickFilter = includes(collectionQuickFilters)

/**
 * How many filters are active: the search, each standalone filter that is set and the quick
 * filter. The sort, the view and the grouping are not filters.
 */
export function activeFilterCount(query: CollectionQuery): number {
  return (
    activeUnitFilterCount(query) +
    (query.search.trim() === "" ? 0 : 1) +
    (query.quick === null ? 0 : 1)
  )
}
