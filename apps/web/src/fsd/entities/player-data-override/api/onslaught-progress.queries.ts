import { queryOptions } from "@tanstack/react-query"

import { getOnslaughtProgress } from "./onslaught-progress.api"

export const onslaughtProgressQueries = {
  all: () => ["player-data-overrides", "onslaught"] as const,
  current: () =>
    queryOptions({
      queryKey: [...onslaughtProgressQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getOnslaughtProgress(signal),
    }),
}
