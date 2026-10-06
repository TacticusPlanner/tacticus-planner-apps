import type { LegendaryEventUnitFilter } from "../model/types"

/**
 * The allowed-alliance rule of a lane from its `allowedUnitsFilter`, e.g. "No Xenos" or
 * "No Chaos or Orks": the excluded targets' labels joined as a localized "or" list, wrapped in the
 * negation template. `undefined` when the lane excludes nothing.
 */
export function laneAllowedRule(
  allowedUnitsFilter: readonly LegendaryEventUnitFilter[],
  labelOf: (filter: LegendaryEventUnitFilter) => string,
  negate: (label: string) => string,
  locale: string
): string | undefined {
  const excluded = allowedUnitsFilter
    .filter((filter) => filter.exclude)
    .map((filter) => labelOf({ ...filter, exclude: false }))
  if (excluded.length === 0) return undefined
  const list = new Intl.ListFormat(locale, { type: "disjunction" }).format(
    excluded
  )
  return negate(list)
}
