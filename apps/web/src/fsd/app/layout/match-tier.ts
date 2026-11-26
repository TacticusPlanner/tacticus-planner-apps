/** How well a query matches one row; lower is better, `undefined` is no match. */
export type MatchTier = number

export interface MatchFields {
  label: string
  description: string
  keywords: readonly string[]
  /** Labels of the places the row sits in (its section, its group). */
  context: readonly string[]
}

const WORD_SPLIT = /[\s\-–—/·:,.()]+/u

/** Lowercase without accents, so "uthar" finds "Ûthar". */
export function foldText(text: string): string {
  return text.normalize("NFD").replaceAll(/\p{M}/gu, "").toLocaleLowerCase()
}

function words(text: string): string[] {
  return foldText(text).split(WORD_SPLIT).filter(Boolean)
}

/**
 * Ranks one row against a trimmed query folded by `foldText`:
 * 0 label starts with it, 1 a label word starts with it, 2 a keyword starts with it,
 * 3 a description word starts with it, 4 a section/group word starts with it (so "dailies" also
 * lists Dailies' pages), 5 every word of a multi-word query starts a word somewhere in the row,
 * 6 a 3+ character query appears anywhere in the label or description.
 */
export function matchTier(
  query: string,
  fields: MatchFields
): MatchTier | undefined {
  const label = foldText(fields.label)
  if (label.startsWith(query)) return 0
  const labelWords = words(fields.label)
  if (labelWords.some((word) => word.startsWith(query))) return 1
  const keywords = fields.keywords.map((keyword) => foldText(keyword))
  if (keywords.some((keyword) => keyword.startsWith(query))) return 2
  const descriptionWords = words(fields.description)
  if (descriptionWords.some((word) => word.startsWith(query))) return 3
  const contextWords = fields.context.flatMap(words)
  if (contextWords.some((word) => word.startsWith(query))) return 4

  const tokens = words(query)
  if (tokens.length > 1) {
    const all = [
      ...labelWords,
      ...keywords.flatMap(words),
      ...descriptionWords,
      ...contextWords,
    ]
    if (tokens.every((token) => all.some((word) => word.startsWith(token))))
      return 5
  }
  if (
    query.length >= 3 &&
    (label.includes(query) || foldText(fields.description).includes(query))
  )
    return 6
  return undefined
}
