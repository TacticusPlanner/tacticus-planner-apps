/**
 * `value`, narrowed, for a lookup the caller knows hits (an index inside the array's bounds, a key
 * the map was built from, a result that is only `null` for inputs never passed). A miss is a bug,
 * so it throws naming `what` instead of letting `undefined` or `null` travel on to a later "cannot
 * read properties of undefined".
 */
export function required<T>(value: T | null | undefined, what: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Missing ${what}`)
  }
  return value
}
