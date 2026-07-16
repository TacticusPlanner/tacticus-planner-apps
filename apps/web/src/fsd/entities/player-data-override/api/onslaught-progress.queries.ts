import { queryOptions } from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"

import { getOnslaughtProgress } from "./onslaught-progress.api"

export const onslaughtProgressQueries = {
  all: (accountId: string) =>
    [...authenticatedQueryKey(accountId), "player-data-overrides"] as const,
  current: (accountId: string) =>
    queryOptions({
      queryKey: [
        ...onslaughtProgressQueries.all(accountId),
        "onslaught",
      ] as const,
      queryFn: ({ signal }) => getOnslaughtProgress(signal),
    }),
}
