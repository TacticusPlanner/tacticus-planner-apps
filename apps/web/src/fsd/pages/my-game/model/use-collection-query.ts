import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"
import {
  progressionIndex,
  rankIndex,
  type Rarity,
} from "@workspace/game-domain"

import { usePersistedSelection } from "@/shared/lib"

import {
  defaultCollectionQuery,
  defaultCollectionSort,
  isCollectionAlliance,
  isCollectionAttackType,
  isCollectionKind,
  isCollectionOwnership,
  isCollectionProgression,
  isCollectionQuickFilter,
  isCollectionRank,
  isCollectionRarity,
  isCollectionSort,
  type CollectionQuery,
  type CollectionShardSource,
  type CollectionSort,
} from "./collection-query"
import type { CollectionOptions } from "./use-collection-options"

/** The query parameter each part of the query lives in. */
const PARAM = {
  search: "q",
  alliance: "alliance",
  factions: "faction",
  rarities: "rarity",
  rankMin: "rankMin",
  rankMax: "rankMax",
  starsMin: "starsMin",
  starsMax: "starsMax",
  ownership: "owned",
  kind: "kind",
  attack: "attack",
  hitsMin: "hitsMin",
  hitsMax: "hitsMax",
  movement: "move",
  rangeMin: "rangeMin",
  rangeMax: "rangeMax",
  damageTypes: "damage",
  traits: "trait",
  shardSources: "source",
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
 * invalid value is removed, a list keeps only its valid items, and a range set backwards is swapped.
 * The values only the catalog can check (factions, the combat filters' numbers, damage types,
 * traits and shard sources) are kept as they are and not applied while `options` is `undefined`.
 */
function readCollectionQuery(
  params: URLSearchParams,
  options: CollectionOptions | undefined,
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
  /** A number the catalog offers (`values`); `undefined` while it cannot be checked yet. */
  const amount = (
    param: string,
    values: readonly number[] | undefined
  ): number | null => {
    const raw = params.get(param)
    if (raw === null || !values) return null
    const value = Number(raw)
    if (values.includes(value)) return value
    fixes[param] = null
    return null
  }
  /** Swaps a pair read backwards, here and in the URL. */
  const ordered = <T>(
    [minParam, maxParam]: [string, string],
    [min, max]: [T | null, T | null],
    position: (value: T) => number
  ): [T | null, T | null] => {
    if (min === null || max === null || position(min) <= position(max))
      return [min, max]
    fixes[minParam] = String(max)
    fixes[maxParam] = String(min)
    return [max, min]
  }
  const among =
    (ids: readonly { id: string }[] | readonly string[] | undefined) =>
    (value: string): value is string =>
      ids !== undefined &&
      ids.some((item) => (typeof item === "string" ? item : item.id) === value)

  const identity = (value: number) => value
  const [rankMin, rankMax] = ordered(
    [PARAM.rankMin, PARAM.rankMax],
    [
      one(PARAM.rankMin, isCollectionRank),
      one(PARAM.rankMax, isCollectionRank),
    ],
    rankIndex
  )
  const [starsMin, starsMax] = ordered(
    [PARAM.starsMin, PARAM.starsMax],
    [
      one(PARAM.starsMin, isCollectionProgression),
      one(PARAM.starsMax, isCollectionProgression),
    ],
    progressionIndex
  )
  const [hitsMin, hitsMax] = ordered(
    [PARAM.hitsMin, PARAM.hitsMax],
    [
      amount(PARAM.hitsMin, options?.hits),
      amount(PARAM.hitsMax, options?.hits),
    ],
    identity
  )
  const [rangeMin, rangeMax] = ordered(
    [PARAM.rangeMin, PARAM.rangeMax],
    [
      amount(PARAM.rangeMin, options?.ranges),
      amount(PARAM.rangeMax, options?.ranges),
    ],
    identity
  )
  const ready = <T>(check: T) => (options ? check : undefined)
  const query: CollectionQuery = {
    search: params.get(PARAM.search) ?? "",
    alliance: one(PARAM.alliance, isCollectionAlliance),
    factions: many(PARAM.factions, ready(among(options?.factions))),
    rarities: many<Rarity>(PARAM.rarities, isCollectionRarity),
    rankMin,
    rankMax,
    starsMin,
    starsMax,
    ownership: one(PARAM.ownership, isCollectionOwnership),
    kind: one(PARAM.kind, isCollectionKind),
    attack: one(PARAM.attack, isCollectionAttackType),
    hitsMin,
    hitsMax,
    movement: amount(PARAM.movement, options?.movements),
    rangeMin,
    rangeMax,
    damageTypes: many(PARAM.damageTypes, ready(among(options?.damageTypes))),
    traits: many(PARAM.traits, ready(among(options?.traits))),
    shardSources: many<CollectionShardSource>(
      PARAM.shardSources,
      ready(
        (value: string): value is CollectionShardSource =>
          (options?.shardSources as readonly string[] | undefined)?.includes(
            value
          ) ?? false
      )
    ),
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
  if (typeof value === "number") return String(value)
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
 * &rankMax=&starsMin=&starsMax=&owned=&kind=&attack=&hitsMin=&hitsMax=&move=&rangeMin=&rangeMax=
 * &damage=&trait=&source=&quick=&sort=`) so reload, Back and shared links restore it. Invalid
 * values are dropped from the URL (a list keeps its valid items) and a backwards range is swapped.
 * `options` validates the values only the catalog knows; while it is `undefined` (catalog loading)
 * those raw values are kept and not applied yet. The last selected sort is
 * remembered in this browser and applies when the URL carries none.
 */
export function useCollectionQuery(
  options: CollectionOptions | undefined
): CollectionQueryState {
  const [params, setParams] = useSearchParams()
  const [rememberedSort, rememberSort] = usePersistedSelection<CollectionSort>(
    SORT_STORAGE_KEY,
    isCollectionSort,
    defaultCollectionSort
  )
  const { query, fixes } = useMemo(
    () => readCollectionQuery(params, options, rememberedSort),
    [params, options, rememberedSort]
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
