import { useUrlQuery } from "@/shared/lib"

import {
  readSuggestionsQuery,
  writeSuggestionsQuery,
} from "./suggestions-query"

/** The Suggestions tab's query, kept in the URL. */
export const useSuggestionsQuery = () =>
  useUrlQuery(readSuggestionsQuery, writeSuggestionsQuery)
