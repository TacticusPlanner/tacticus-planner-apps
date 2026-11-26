import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  UNIT_FILTER_PARAMS,
  applyParamFixes,
  paramReader,
  readUnitFilters,
  serializeUnitFilter,
} from "@/features/unit-filters"
import type { ParamFixes, UnitFilterOptions } from "@/features/unit-filters"
import { storedPreference, usePersistedSelection } from "@/shared/lib"

import {
  defaultCollectionGrouping,
  defaultCollectionLayout,
  defaultCollectionQuery,
  defaultCollectionSort,
  isCollectionGrouping,
  isCollectionLayout,
  isCollectionQuickFilter,
  isCollectionSort,
} from "./collection-query"
import type {
  CollectionGrouping,
  CollectionLayout,
  CollectionQuery,
  CollectionQuickFilter,
  CollectionSort,
} from "./collection-query"

/** The parts of the query the URL carries; the quick filter is remembered in the browser instead. */
type UrlQueryKey = Exclude<keyof CollectionQuery, "quick">

/** The query parameter each part of the query lives in. */
const PARAM = {
  ...UNIT_FILTER_PARAMS,
  search: "q",
  hideUnowned: "owned",
  sort: "sort",
  view: "view",
  group: "group",
} as const satisfies Record<UrlQueryKey, string>

/** The value of `?owned=` that hides unowned units; any other value is dropped from the URL. */
const HIDE_UNOWNED_VALUE = "owned"
const isHideUnownedValue = (
  value: string
): value is typeof HIDE_UNOWNED_VALUE => value === HIDE_UNOWNED_VALUE

const SORT_STORAGE_KEY = storedPreference("collection", "sort")
const VIEW_STORAGE_KEY = storedPreference("collection", "view")
const GROUP_STORAGE_KEY = storedPreference("collection", "group")
const QUICK_STORAGE_KEY = storedPreference("collection", "quick")

/** The stored quick filter; `""` is none. */
type RememberedQuick = CollectionQuickFilter | ""
const isRememberedQuick = (value: unknown): value is RememberedQuick =>
  value === "" || (typeof value === "string" && isCollectionQuickFilter(value))

/** The parts of the query that are display settings, not filters: Clear filters keeps them. */
const SETTINGS = new Set<keyof CollectionQuery>([
  "sort",
  "view",
  "group",
  "hideUnowned",
])

/** Every part of the query at its default except the settings. */
const CLEARED_FILTERS: Partial<CollectionQuery> = Object.fromEntries(
  Object.entries(defaultCollectionQuery).filter(
    ([key]) => !SETTINGS.has(key as keyof CollectionQuery)
  )
)

/** What the browser remembers for the parts the URL does not carry. */
interface RememberedSettings {
  sort: CollectionSort
  view: CollectionLayout
  group: CollectionGrouping
  quick: CollectionQuickFilter | null
}

/**
 * The query the URL holds, read in one pass, and the fixes that make the URL say the same: an
 * invalid value is removed, a list keeps only its valid items, and a range set backwards is swapped.
 * The values only the catalog can check (factions, the combat filters' numbers, damage types,
 * traits and shard sources) are kept as they are and not applied while `options` is `undefined`.
 */
function readCollectionQuery(
  params: URLSearchParams,
  options: UnitFilterOptions | undefined,
  remembered: RememberedSettings
): { query: CollectionQuery; fixes: ParamFixes } {
  const fixes: ParamFixes = {}
  const { one } = paramReader(params, fixes)
  const query: CollectionQuery = {
    ...readUnitFilters(params, options, fixes),
    search: params.get(PARAM.search) ?? "",
    hideUnowned: one(PARAM.hideUnowned, isHideUnownedValue) !== null,
    quick: remembered.quick,
    sort: one(PARAM.sort, isCollectionSort) ?? remembered.sort,
    view: one(PARAM.view, isCollectionLayout) ?? remembered.view,
    group: one(PARAM.group, isCollectionGrouping) ?? remembered.group,
  }
  return { query, fixes }
}

/** A query part as its URL value; `null` removes the parameter (the part is at its default). */
function serialize<K extends keyof CollectionQuery>(
  key: K,
  value: CollectionQuery[K]
): string | null {
  if (key === "hideUnowned") return value === true ? HIDE_UNOWNED_VALUE : null
  if (key === "sort")
    return value === defaultCollectionSort ? null : (value as string)
  if (key === "view")
    return value === defaultCollectionLayout ? null : (value as string)
  if (key === "group")
    return value === defaultCollectionGrouping ? null : (value as string)
  if (key === "search") return value === "" ? null : (value as string)
  return serializeUnitFilter(value as never)
}

export interface CollectionQueryState {
  query: CollectionQuery
  /** Changes the given parts in one history replacement; a new sort, view, grouping or quick filter
   *  is also remembered (the quick filter only in the browser, not the URL). */
  update: (patch: Partial<CollectionQuery>) => void
  /** Removes the search, every filter and the quick filter in one replacement; keeps the settings
   *  (sort, view, grouping, and hiding unowned units). */
  clear: () => void
}

/**
 * The Collection toolbar's state, owned by the URL (`?q=&alliance=&faction=&rarity=&rankMin=
 * &rankMax=&starsMin=&starsMax=&owned=&kind=&summons=&abilityRole=&abilityTarget=&abilityAttack=&attack=&hitsMin=&hitsMax=&move=&rangeMin=&rangeMax=
 * &damage=&trait=&source=&sort=&view=&group=`) so reload, Back and shared links restore it. Invalid
 * values are dropped from the URL (a list keeps its valid items) and a backwards range is swapped.
 * `options` validates the values only the catalog knows; while it is `undefined` (catalog loading)
 * those raw values are kept and not applied yet. The last selected sort, view and grouping are
 * remembered in this browser and apply when the URL carries none; a value arriving in a link is
 * shown without being remembered. The quick filter is remembered in this browser only, not in the
 * URL.
 */
export function useCollectionQuery(
  options: UnitFilterOptions | undefined
): CollectionQueryState {
  const [params, setParams] = useSearchParams()
  const [rememberedSort, rememberSort] = usePersistedSelection<CollectionSort>(
    SORT_STORAGE_KEY,
    isCollectionSort,
    defaultCollectionSort
  )
  const [rememberedView, rememberView] =
    usePersistedSelection<CollectionLayout>(
      VIEW_STORAGE_KEY,
      isCollectionLayout,
      defaultCollectionLayout
    )
  const [rememberedGroup, rememberGroup] =
    usePersistedSelection<CollectionGrouping>(
      GROUP_STORAGE_KEY,
      isCollectionGrouping,
      defaultCollectionGrouping
    )
  const [rememberedQuick, rememberQuick] =
    usePersistedSelection<RememberedQuick>(
      QUICK_STORAGE_KEY,
      isRememberedQuick,
      ""
    )
  const { query, fixes } = useMemo(
    () =>
      readCollectionQuery(params, options, {
        sort: rememberedSort,
        view: rememberedView,
        group: rememberedGroup,
        quick: rememberedQuick || null,
      }),
    [
      params,
      options,
      rememberedSort,
      rememberedView,
      rememberedGroup,
      rememberedQuick,
    ]
  )

  // One replacement for every fix, so fixes to several parameters cannot overwrite each other.
  const fixesKey = Object.keys(fixes).length > 0 ? JSON.stringify(fixes) : ""
  useEffect(() => {
    if (!fixesKey) return
    const pending = JSON.parse(fixesKey) as ParamFixes
    setParams((previous) => applyParamFixes(previous, pending), {
      replace: true,
    })
  }, [fixesKey, setParams])

  const update = useCallback(
    (patch: Partial<CollectionQuery>) => {
      if (patch.sort !== undefined) rememberSort(patch.sort)
      if (patch.view !== undefined) rememberView(patch.view)
      if (patch.group !== undefined) rememberGroup(patch.group)
      if (patch.quick !== undefined) rememberQuick(patch.quick ?? "")
      setParams(
        (previous) => {
          for (const key of Object.keys(patch) as (keyof CollectionQuery)[]) {
            if (key === "quick") continue
            const value = serialize(key, patch[key] as never)
            if (value === null) previous.delete(PARAM[key])
            else previous.set(PARAM[key], value)
          }
          return previous
        },
        { replace: true }
      )
    },
    [rememberSort, rememberView, rememberGroup, rememberQuick, setParams]
  )

  const clear = useCallback(() => update(CLEARED_FILTERS), [update])

  return { query, update, clear }
}
