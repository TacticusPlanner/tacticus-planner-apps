import {
  firstDifference,
  readFlag,
  readList,
  writeUrlQuery,
} from "@/shared/lib"

import type { CharacterSuggestions } from "./suggestions"

/** The Suggestions tab's search, filter and chip, carried in the URL. */
export type SuggestionsQuery = {
  /** Matches a character's name. */
  q: string
  faction: string[]
  /** Hides slots that aren't open yet (on by default). */
  unlocked: boolean
}

export const DEFAULT_SUGGESTIONS_QUERY: SuggestionsQuery = {
  q: "",
  faction: [],
  unlocked: true,
}

export function readSuggestionsQuery(
  params: URLSearchParams
): SuggestionsQuery {
  return {
    q: params.get("q") ?? "",
    faction: readList(params, "faction"),
    unlocked: readFlag(params, "unlocked", true),
  }
}

export const writeSuggestionsQuery = (
  params: URLSearchParams,
  patch: Partial<SuggestionsQuery>
): URLSearchParams => writeUrlQuery(params, patch, DEFAULT_SUGGESTIONS_QUERY)

/** Whether the search or the faction filter narrows the list (the chip is a view choice). */
export const suggestionsQueryNarrows = (query: SuggestionsQuery): boolean =>
  query.q.trim() !== "" || query.faction.length > 0

/**
 * The characters the query keeps, each with only the suggestions it shows (no slot that isn't open
 * yet while "Unlocked slots only" is on), the ones gaining most first, then by name.
 */
export function visibleSuggestions(
  characters: readonly CharacterSuggestions[],
  query: SuggestionsQuery,
  { nameOf, locale }: { nameOf: (id: string) => string; locale: string }
): CharacterSuggestions[] {
  const search = query.q.trim().toLocaleLowerCase(locale)
  const gain = (entry: CharacterSuggestions) =>
    entry.suggestions.reduce((sum, suggestion) => sum + suggestion.gain, 0)
  return characters
    .filter(
      (entry) =>
        (search === "" ||
          nameOf(entry.characterId)
            .toLocaleLowerCase(locale)
            .includes(search)) &&
        (query.faction.length === 0 || query.faction.includes(entry.faction))
    )
    .map((entry) => ({
      ...entry,
      suggestions: query.unlocked
        ? entry.suggestions.filter((suggestion) => !suggestion.locked)
        : entry.suggestions,
    }))
    .filter((entry) => entry.suggestions.length > 0)
    .toSorted((a, b) =>
      firstDifference(
        gain(b) - gain(a),
        nameOf(a.characterId).localeCompare(nameOf(b.characterId), locale)
      )
    )
}
