import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"
import type { Rarity } from "@workspace/game-domain"

import { usePersistedSelection, useSearchParamState } from "@/shared/lib"

import {
  defaultCollectionQuery,
  defaultCollectionSort,
  isCollectionAlliance,
  isCollectionKind,
  isCollectionOwnership,
  isCollectionQuickFilter,
  isCollectionRank,
  isCollectionRarity,
  isCollectionSort,
  type CollectionQuery,
  type CollectionSort,
} from "./collection-query"

/** The query parameter each part of the query lives in. */
const PARAM = {
  search: "q",
  alliance: "alliance",
  factions: "faction",
  rarities: "rarity",
  rankMin: "rankMin",
  rankMax: "rankMax",
  ownership: "owned",
  kind: "kind",
  quick: "quick",
  sort: "sort",
} as const satisfies Record<keyof CollectionQuery, string>

const SORT_STORAGE_KEY = "collection.sort"

/** Every part of the query at its default except the sort, which Clear filters keeps. */
const CLEARED_FILTERS: Partial<CollectionQuery> = Object.fromEntries(
  Object.entries(defaultCollectionQuery).filter(([key]) => key !== "sort")
)

const anyText = () => true
const list = (raw: string) => raw.split(",")
const listOf =
  (isItem: (value: string) => boolean) =>
  (raw: string): boolean =>
    raw !== "" && list(raw).every(isItem)

/** A query part as its URL value; `null` removes the parameter (the part is at its default). */
function serialize<K extends keyof CollectionQuery>(
  key: K,
  value: CollectionQuery[K]
): string | null {
  if (key === "sort")
    return value === defaultCollectionSort ? null : (value as string)
  if (Array.isArray(value)) return value.length > 0 ? value.join(",") : null
  if (key === "search") return value === "" ? null : (value as string)
  return (value as string | null) ?? null
}

export interface CollectionQueryState {
  query: CollectionQuery
  /** Changes the given parts in one history replacement; a new sort is also remembered. */
  update: (patch: Partial<CollectionQuery>) => void
  /** Removes the search, every filter and the quick filter in one replacement; keeps the sort. */
  clear: () => void
}

/**
 * The Collection toolbar's state, owned by the URL (`?q=&alliance=&faction=&rarity=&rankMin=
 * &rankMax=&owned=&kind=&quick=&sort=`) so reload, Back and shared links restore it. Invalid values
 * are dropped from the URL. `factionIds` validates the `faction` list; while it is `undefined`
 * (catalog loading) the raw value is kept and not applied yet. The last selected sort is
 * remembered in this browser and applies when the URL carries none.
 */
export function useCollectionQuery(
  factionIds: ReadonlySet<string> | undefined
): CollectionQueryState {
  const [, setParams] = useSearchParams()
  const [rememberedSort, rememberSort] = usePersistedSelection<CollectionSort>(
    SORT_STORAGE_KEY,
    isCollectionSort,
    defaultCollectionSort
  )
  const isFactionList = useCallback(
    (raw: string) =>
      factionIds === undefined
        ? undefined
        : listOf((id) => factionIds.has(id))(raw),
    [factionIds]
  )

  const [search] = useSearchParamState(PARAM.search, anyText, "")
  const [alliance] = useSearchParamState(
    PARAM.alliance,
    isCollectionAlliance,
    ""
  )
  const [factions] = useSearchParamState(PARAM.factions, isFactionList, "")
  const [rarities] = useSearchParamState(
    PARAM.rarities,
    listOf(isCollectionRarity),
    ""
  )
  const [rankMin] = useSearchParamState(PARAM.rankMin, isCollectionRank, "")
  const [rankMax] = useSearchParamState(PARAM.rankMax, isCollectionRank, "")
  const [ownership] = useSearchParamState(
    PARAM.ownership,
    isCollectionOwnership,
    ""
  )
  const [kind] = useSearchParamState(PARAM.kind, isCollectionKind, "")
  const [quick] = useSearchParamState(PARAM.quick, isCollectionQuickFilter, "")
  const [sort] = useSearchParamState<string>(
    PARAM.sort,
    isCollectionSort,
    rememberedSort
  )

  const query = useMemo<CollectionQuery>(
    () => ({
      search,
      alliance: isCollectionAlliance(alliance) ? alliance : null,
      factions: factions ? list(factions) : [],
      rarities: rarities ? (list(rarities) as Rarity[]) : [],
      rankMin: isCollectionRank(rankMin) ? rankMin : null,
      rankMax: isCollectionRank(rankMax) ? rankMax : null,
      ownership: isCollectionOwnership(ownership) ? ownership : null,
      kind: isCollectionKind(kind) ? kind : null,
      quick: isCollectionQuickFilter(quick) ? quick : null,
      sort: isCollectionSort(sort) ? sort : defaultCollectionSort,
    }),
    [
      search,
      alliance,
      factions,
      rarities,
      rankMin,
      rankMax,
      ownership,
      kind,
      quick,
      sort,
    ]
  )

  const update = useCallback(
    (patch: Partial<CollectionQuery>) => {
      if (patch.sort !== undefined) rememberSort(patch.sort)
      setParams(
        (previous) => {
          for (const key of Object.keys(patch) as (keyof CollectionQuery)[]) {
            const value = serialize(key, patch[key] as never)
            if (value === null) previous.delete(PARAM[key])
            else previous.set(PARAM[key], value)
          }
          return previous
        },
        { replace: true }
      )
    },
    [rememberSort, setParams]
  )

  const clear = useCallback(() => update(CLEARED_FILTERS), [update])

  return { query, update, clear }
}
