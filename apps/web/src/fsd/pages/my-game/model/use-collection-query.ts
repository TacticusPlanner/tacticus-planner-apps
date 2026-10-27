import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"
import { rankIndex, type Rarity } from "@workspace/game-domain"

import { usePersistedSelection } from "@/shared/lib"

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

const list = (raw: string) => raw.split(",")

/** Each parameter to rewrite (`null` removes it) to bring the URL in line with the query read. */
type ParamFixes = Partial<Record<string, string | null>>

/**
 * The query the URL holds, read in one pass, and the fixes that make the URL say the same: an
 * invalid value is removed, a list keeps only its valid items, and a rank range set backwards is
 * swapped. While `factionIds` is `undefined` the `faction` list cannot be checked yet, so it is kept
 * as it is and not applied.
 */
function readCollectionQuery(
  params: URLSearchParams,
  factionIds: ReadonlySet<string> | undefined,
  rememberedSort: CollectionSort
): { query: CollectionQuery; fixes: ParamFixes } {
  const fixes: ParamFixes = {}
  const one = <T extends string>(
    param: string,
    isValid: (value: string) => value is T
  ): T | null => {
    const raw = params.get(param)
    if (raw === null) return null
    if (isValid(raw)) return raw
    fixes[param] = null
    return null
  }
  const many = <T extends string>(
    param: string,
    isItem: ((value: string) => value is T) | undefined
  ): T[] => {
    const raw = params.get(param)
    if (raw === null || !isItem) return []
    const items = list(raw)
    const valid = items.filter(isItem)
    if (valid.length !== items.length) {
      fixes[param] = valid.length > 0 ? valid.join(",") : null
    }
    return valid
  }

  let rankMin = one(PARAM.rankMin, isCollectionRank)
  let rankMax = one(PARAM.rankMax, isCollectionRank)
  if (rankMin && rankMax && rankIndex(rankMin) > rankIndex(rankMax)) {
    ;[rankMin, rankMax] = [rankMax, rankMin]
    fixes[PARAM.rankMin] = rankMin
    fixes[PARAM.rankMax] = rankMax
  }
  const query: CollectionQuery = {
    search: params.get(PARAM.search) ?? "",
    alliance: one(PARAM.alliance, isCollectionAlliance),
    factions: many(
      PARAM.factions,
      factionIds && ((id: string): id is string => factionIds.has(id))
    ),
    rarities: many<Rarity>(PARAM.rarities, isCollectionRarity),
    rankMin,
    rankMax,
    ownership: one(PARAM.ownership, isCollectionOwnership),
    kind: one(PARAM.kind, isCollectionKind),
    quick: one(PARAM.quick, isCollectionQuickFilter),
    sort: one(PARAM.sort, isCollectionSort) ?? rememberedSort,
  }
  return { query, fixes }
}

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
 * are dropped from the URL (a list keeps its valid items) and a backwards rank range is swapped.
 * `factionIds` validates the `faction` list; while it is `undefined` (catalog loading) the raw value
 * is kept and not applied yet. The last selected sort is
 * remembered in this browser and applies when the URL carries none.
 */
export function useCollectionQuery(
  factionIds: ReadonlySet<string> | undefined
): CollectionQueryState {
  const [params, setParams] = useSearchParams()
  const [rememberedSort, rememberSort] = usePersistedSelection<CollectionSort>(
    SORT_STORAGE_KEY,
    isCollectionSort,
    defaultCollectionSort
  )
  const { query, fixes } = useMemo(
    () => readCollectionQuery(params, factionIds, rememberedSort),
    [params, factionIds, rememberedSort]
  )

  // One replacement for every fix, so fixes to several parameters cannot overwrite each other.
  const fixesKey = Object.keys(fixes).length > 0 ? JSON.stringify(fixes) : ""
  useEffect(() => {
    if (!fixesKey) return
    const pending = JSON.parse(fixesKey) as ParamFixes
    setParams(
      (previous) => {
        for (const [param, value] of Object.entries(pending)) {
          if (value == null) previous.delete(param)
          else previous.set(param, value)
        }
        return previous
      },
      { replace: true }
    )
  }, [fixesKey, setParams])

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
