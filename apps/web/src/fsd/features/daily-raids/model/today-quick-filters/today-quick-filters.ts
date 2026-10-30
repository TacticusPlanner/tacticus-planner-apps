/** Today's quick filters, in display order (daily-raids-today spec: *Today quick filters*). */
export const TODAY_QUICK_FILTERS = ["fewerRaids", "totalMaterials"] as const
export type TodayQuickFilter = (typeof TODAY_QUICK_FILTERS)[number]

/** The engine options the quick filters switch on; both off is the default schedule. */
export type TodayQuickFilterOptions = {
  fewerRaids: boolean
  combineGoals: boolean
}

export const isTodayQuickFilter = (value: string): value is TodayQuickFilter =>
  (TODAY_QUICK_FILTERS as readonly string[]).includes(value)

/** Earlier `quick` values still accepted from saved links: "bottlenecks" became "totalMaterials". */
const LEGACY_QUICK_FILTERS: Readonly<Record<string, TodayQuickFilter>> = {
  bottlenecks: "totalMaterials",
}

/** The `quick` search parameter as a comma list: unknown values are dropped, display order kept. */
export function parseTodayQuickFilters(
  value: string | null
): TodayQuickFilter[] {
  const values = new Set(
    (value ?? "")
      .split(",")
      .map((quick) => LEGACY_QUICK_FILTERS[quick] ?? quick)
  )
  return TODAY_QUICK_FILTERS.filter((quick) => values.has(quick))
}

/** The `quick` search parameter for `filters`, or `null` to remove it. */
export function serializeTodayQuickFilters(
  filters: readonly TodayQuickFilter[]
): string | null {
  const ordered = TODAY_QUICK_FILTERS.filter((quick) => filters.includes(quick))
  return ordered.length > 0 ? ordered.join(",") : null
}

export function todayQuickFilterOptions(
  filters: readonly TodayQuickFilter[]
): TodayQuickFilterOptions {
  return {
    fewerRaids: filters.includes("fewerRaids"),
    combineGoals: filters.includes("totalMaterials"),
  }
}
