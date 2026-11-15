import {
  collectionSorts,
  isCollectionSort,
  type CollectionSort,
} from "./collection-query"

export const COMPARE_LATEST = "latest"
export const COMPARE_CURRENT = "current"

export const compareLanes = ["alpha", "beta", "gamma"] as const
type CompareLane = (typeof compareLanes)[number]

/** Compare mode's own order first (power gained), then Collection's sorts on the "to" state. */
export const compareOrders = ["gain", ...collectionSorts] as const
export type CompareOrder = "gain" | CollectionSort
const defaultCompareOrder: CompareOrder = "gain"

/** Compare mode as the URL holds it (design D4); `compare` null is normal Collection. */
export interface CompareQuery {
  /** `latest`, a personal snapshot id or `le:<eventId>:<recordId>`. */
  compare: string | null
  /** `current` (the default) or another source id. */
  to: string
  /** The Legendary Event filter: an event id, optionally one lane. */
  event: string | null
  lane: CompareLane | null
  order: CompareOrder
}

export const COMPARE_PARAM = {
  compare: "compare",
  to: "to",
  event: "le",
  lane: "lane",
  order: "order",
} as const satisfies Record<keyof CompareQuery, string>

const isCompareLane = (value: string): value is CompareLane =>
  (compareLanes as readonly string[]).includes(value)

const isCompareOrder = (value: string): value is CompareOrder =>
  value === "gain" || isCollectionSort(value)

/** A source the pickers offer, newest `takenAt` first. */
export interface CompareSourceRef {
  id: string
  takenAt: string
}

/** Each parameter to rewrite (`null` removes it). */
export type CompareParamFixes = Partial<Record<string, string | null>>

/**
 * The compare state the URL holds and the fixes that make the URL say the same. Format-only
 * checks happen here; ids are checked once the sources have loaded (`resolveCompareSources`).
 * Without `compare`, `to` and the filters are dropped.
 */
export function readCompareQuery(params: URLSearchParams): {
  query: CompareQuery
  fixes: CompareParamFixes
} {
  const fixes: CompareParamFixes = {}
  const compare = params.get(COMPARE_PARAM.compare) || null
  const raw = (param: string) => {
    const value = params.get(param)
    if (value !== null && compare === null) {
      fixes[param] = null
      return null
    }
    return value
  }
  const to = raw(COMPARE_PARAM.to)
  const event = raw(COMPARE_PARAM.event)
  const lane = raw(COMPARE_PARAM.lane)
  const order = raw(COMPARE_PARAM.order)
  if (compare === null) {
    return {
      query: {
        compare: null,
        to: COMPARE_CURRENT,
        event: null,
        lane: null,
        order: defaultCompareOrder,
      },
      fixes,
    }
  }
  if (to === COMPARE_CURRENT) fixes[COMPARE_PARAM.to] = null
  // An event id is checked against the user's plans once they load (see `resolveCompareSources`).
  const validEvent = event || null
  if (event !== null && validEvent === null) fixes[COMPARE_PARAM.event] = null
  const validLane =
    lane !== null && validEvent !== null && isCompareLane(lane) ? lane : null
  if (lane !== null && validLane === null) fixes[COMPARE_PARAM.lane] = null
  const validOrder = order !== null && isCompareOrder(order) ? order : null
  if (order !== null && (validOrder === null || validOrder === "gain")) {
    fixes[COMPARE_PARAM.order] = null
  }
  return {
    query: {
      compare,
      to: to || COMPARE_CURRENT,
      event: validEvent,
      lane: validLane,
      order: validOrder ?? defaultCompareOrder,
    },
    fixes,
  }
}

export interface ResolvedCompare {
  /** The source compared from; null when no source exists. */
  from: string | null
  /** `current` or a source newer than `from`. */
  to: string
  fixes: CompareParamFixes
}

/**
 * The sources a compare query names, once the source list has loaded (spec: "Collection has a
 * compare mode held in the URL"): `latest` is the newest source; an unknown `compare` falls back to
 * `latest`; a `to` that is unknown, or not newer than `from`, falls back to `current`.
 */
export function resolveCompareSources(
  query: Pick<CompareQuery, "compare" | "to" | "event">,
  sources: readonly CompareSourceRef[],
  /** The events the user has a plan for; an unknown `le` is dropped (with its lane). */
  eventIds: readonly string[] = []
): ResolvedCompare {
  const fixes: CompareParamFixes = {}
  if (query.event !== null && !eventIds.includes(query.event)) {
    fixes[COMPARE_PARAM.event] = null
    fixes[COMPARE_PARAM.lane] = null
  }
  const byId = new Map(sources.map((source) => [source.id, source]))
  const newest = sources[0]?.id ?? null
  let from: string | null = newest
  if (query.compare !== null && query.compare !== COMPARE_LATEST) {
    if (byId.has(query.compare)) {
      from = query.compare
    } else {
      fixes[COMPARE_PARAM.compare] = COMPARE_LATEST
    }
  }
  let to = COMPARE_CURRENT
  if (query.to !== COMPARE_CURRENT) {
    const target = byId.get(query.to)
    const start = from === null ? undefined : byId.get(from)
    if (target && start && isNewer(target, start)) {
      to = target.id
    } else {
      fixes[COMPARE_PARAM.to] = null
    }
  }
  return { from, to, fixes }
}

function isNewer(a: CompareSourceRef, b: CompareSourceRef): boolean {
  return Date.parse(a.takenAt) > Date.parse(b.takenAt)
}

/** A compare query part as its URL value; `null` removes the parameter. */
export function serializeCompare<K extends keyof CompareQuery>(
  key: K,
  value: CompareQuery[K]
): string | null {
  if (key === "to") return value === COMPARE_CURRENT ? null : value
  if (key === "order") return value === defaultCompareOrder ? null : value
  return value ?? null
}
