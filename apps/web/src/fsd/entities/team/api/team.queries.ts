import { queryOptions } from "@tanstack/react-query"

import { listTeams } from "./team.api"

/** The teams query keys; `all()` covers every teams query, so an import can refresh them. */
const teamKeys = {
  all: () => ["teams"] as const,
  list: () => [...teamKeys.all(), { scope: "list" }] as const,
}

export const teamQueries = {
  all: teamKeys.all,
  list: () =>
    queryOptions({
      queryKey: teamKeys.list(),
      queryFn: ({ signal }) => listTeams(signal),
    }),
}
