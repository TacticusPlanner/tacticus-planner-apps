/** A query value an Items tab keeps in the URL. */
export type UrlQueryValue = string | boolean | readonly string[] | null

const ON = "1"

/** A comma-separated list parameter. */
export const readList = (params: URLSearchParams, key: string): string[] =>
  (params.get(key) ?? "").split(",").filter(Boolean)

/** A flag parameter ("1" when on, "0" when off); absent, it reads as its default. */
export function readFlag(
  params: URLSearchParams,
  key: string,
  fallback = false
): boolean {
  const value = params.get(key)
  return value === null ? fallback : value === ON
}

/** A parameter limited to known options; anything else reads as the fallback. */
export function readOneOf<T extends string>(
  value: string | null,
  options: readonly T[],
  fallback: T
): T {
  return options.find((option) => option === value) ?? fallback
}

/** A value as its parameter text; empty when it should be left out. */
function paramText(
  value: UrlQueryValue | undefined,
  fallback: UrlQueryValue | undefined
): string {
  if (value === null || value === undefined || value === fallback) return ""
  if (typeof value === "boolean") return value ? ON : "0"
  return typeof value === "string" ? value : value.join(",")
}

/**
 * Writes a change into the URL's parameters, leaving out values equal to their default (and empty
 * lists, off flags and nulls) and leaving other parameters alone. A flag whose default is on is
 * written as "0" when turned off.
 */
export function writeUrlQuery<Query extends Record<string, UrlQueryValue>>(
  params: URLSearchParams,
  patch: Partial<Query>,
  defaults: Query
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(patch) as [
    string,
    UrlQueryValue | undefined,
  ][]) {
    const text = paramText(value, defaults[key])
    if (text) next.set(key, text)
    else next.delete(key)
  }
  return next
}
