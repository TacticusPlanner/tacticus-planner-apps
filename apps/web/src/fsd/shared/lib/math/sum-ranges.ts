/** An amount that may roll anywhere from `min` to `max`, such as a reward. */
interface AmountRange {
  min: number
  max: number
}

/**
 * Adds up ranges that share a key, keeping the order each key first appears in. Each result is a
 * copy of the first item with that key, with `min` and `max` summed; the inputs are not changed.
 */
export function sumRanges<T extends AmountRange>(
  items: Iterable<T>,
  key: (item: T) => string
): T[] {
  const totals = new Map<string, T>()
  for (const item of items) {
    const id = key(item)
    const total = totals.get(id)
    totals.set(
      id,
      total
        ? { ...total, min: total.min + item.min, max: total.max + item.max }
        : { ...item }
    )
  }
  return [...totals.values()]
}
