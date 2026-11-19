/**
 * Orders strings by UTF-16 code units: the order `Array#sort()` uses with no comparator. Use it for
 * ids and keys that need a stable, locale-independent order; use `localeCompare` for text shown to
 * people.
 */
export function compareCodeUnits(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
