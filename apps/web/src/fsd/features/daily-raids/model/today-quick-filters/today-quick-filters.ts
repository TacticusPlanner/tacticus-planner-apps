/** Today's quick filters, in display order (daily-raids-today spec: *Today quick filters*). */
export const TODAY_QUICK_FILTERS = [
  "fewerRaids",
  "combineGoals",
  "raidableOnly",
  "preferEvent",
] as const
export type TodayQuickFilter = (typeof TODAY_QUICK_FILTERS)[number]

/** The engine options the quick filters switch on; both off is the default schedule. */
export type TodayQuickFilterOptions = {
  fewerRaids: boolean
  combineGoals: boolean
  /** Leave out battles that must be played manually (fewer than 3 medals). */
  raidableOnly?: boolean
  /** Farm a material at the active campaign event's reached nodes when any of them drops it. */
  preferEvent?: boolean
}

export const isTodayQuickFilter = (value: string): value is TodayQuickFilter =>
  (TODAY_QUICK_FILTERS as readonly string[]).includes(value)

/** The stored quick filters as a comma list: unknown values are dropped, display order kept. */
export function parseTodayQuickFilters(
  value: string | null
): TodayQuickFilter[] {
  const values = new Set((value ?? "").split(","))
  return TODAY_QUICK_FILTERS.filter((quick) => values.has(quick))
}

/** The stored value for `filters`, or `null` when none is on. */
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
    combineGoals: filters.includes("combineGoals"),
    raidableOnly: filters.includes("raidableOnly"),
    preferEvent: filters.includes("preferEvent"),
  }
}
