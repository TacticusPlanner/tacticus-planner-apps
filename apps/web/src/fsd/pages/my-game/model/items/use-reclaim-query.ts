import { useUrlQuery } from "@/shared/lib"

import { readReclaimQuery, writeReclaimQuery } from "./reclaim-query"

/** The Reclaim tab's query, kept in the URL. */
export const useReclaimQuery = () =>
  useUrlQuery(readReclaimQuery, writeReclaimQuery)
