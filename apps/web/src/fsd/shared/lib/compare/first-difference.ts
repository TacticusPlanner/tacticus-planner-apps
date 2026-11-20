/**
 * The first comparison result that orders the pair, else 0: a comparator chain without numbers in
 * a boolean context. `firstDifference(a.rank - b.rank, compareCodeUnits(a.id, b.id))` reads like
 * `a.rank - b.rank || compareCodeUnits(a.id, b.id)` and, like `||`, skips 0 and NaN. Every result
 * is computed, so keep the arguments cheap.
 */
export function firstDifference(...results: readonly number[]): number {
  for (const result of results) {
    if (result !== 0 && !Number.isNaN(result)) return result
  }
  return 0
}
