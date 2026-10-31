import { queryOptions } from "@tanstack/react-query"

import { playerDataOverrideKey } from "./player-data-override.queries"

import { getOnslaughtProgress } from "./onslaught-progress.api"

export const onslaughtProgressQueries = {
  all: () => [...playerDataOverrideKey, "onslaught"] as const,
  current: () =>
    queryOptions({
      queryKey: [...onslaughtProgressQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getOnslaughtProgress(signal),
    }),
}
