/**
 * Loose form of a name or search text for "find this unit" filters: case-insensitive, with
 * diacritics stripped and punctuation/whitespace dropped, so "amm" finds "Âmmuk" and "zka" finds
 * "Z'Kar".
 */
export function normalizeSearchText(text: string, locale?: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase(locale)
    .replace(/[^\p{L}\p{N}]/gu, "")
}

/** Whether any of `names` contains `needle`, a query already put through {@link normalizeSearchText}. */
export function anyNameIncludes(
  names: readonly string[],
  needle: string,
  locale?: string
): boolean {
  return names.some((name) =>
    normalizeSearchText(name, locale).includes(needle)
  )
}

/** Whether `text` contains `query` under {@link normalizeSearchText}; a blank query matches. */
export function matchesSearch(
  text: string,
  query: string,
  locale?: string
): boolean {
  const needle = normalizeSearchText(query, locale)
  return !needle || normalizeSearchText(text, locale).includes(needle)
}
