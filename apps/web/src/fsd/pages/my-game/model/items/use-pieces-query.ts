import { useUrlQuery } from "@/shared/lib"

import { readPiecesQuery, writePiecesQuery } from "./pieces-query"

/** The Pieces tab's query, kept in the URL. */
export const usePiecesQuery = () =>
  useUrlQuery(readPiecesQuery, writePiecesQuery)
