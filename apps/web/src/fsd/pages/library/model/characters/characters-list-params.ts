import { UNIT_FILTER_PARAMS } from "@/features/unit-filters"

const FILTER_PARAMS = new Set<string>(Object.values(UNIT_FILTER_PARAMS))

/**
 * The query string with only the unit filters' parameters kept, or `null` when nothing needs to
 * go (such as the former calculator's `rankStart`/`rankEnd`).
 */
export function withoutForeignParams(search: string): string | null {
  const params = new URLSearchParams(search)
  const foreign = [...params.keys()].filter((key) => !FILTER_PARAMS.has(key))
  if (foreign.length === 0) return null
  for (const key of foreign) params.delete(key)
  const kept = params.toString()
  return kept ? `?${kept}` : ""
}
