/** An inclusive run of consecutive numbers; a single number is `[n, n]`. */
export type NumberRange = readonly [number, number]

/**
 * Collapses numbers into ascending runs of consecutive values (`[3, 7, 12, 13, 14]` gives
 * `[[3, 3], [7, 7], [12, 14]]`). Input order and duplicates do not matter.
 */
export function collapseRanges(numbers: readonly number[]): NumberRange[] {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b)
  const ranges: [number, number][] = []
  for (const value of sorted) {
    const last = ranges.at(-1)
    if (last && value === last[1] + 1) last[1] = value
    else ranges.push([value, value])
  }
  return ranges
}
