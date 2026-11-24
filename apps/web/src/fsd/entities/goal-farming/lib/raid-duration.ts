import type { EstimateOutcome } from "../model/estimate.domain"

/** How many plan days of raids a goal needs once it starts getting energy: its first raid day through
 *  its done day, inclusive (V1's "Total days", UserJot "Show Required Days for Each Goal"). Unlike the
 *  days until done, it leaves out the days spent waiting on goals ahead in priority. `undefined` for a
 *  blocked or unestimated goal, or one needing no raids at all. */
export function goalRaidDuration(
  estimate: EstimateOutcome | undefined
): number | undefined {
  if (!estimate || estimate.status === "Blocked") return undefined
  if (estimate.firstRaidDay === undefined) return undefined
  return estimate.days - estimate.firstRaidDay + 1
}
