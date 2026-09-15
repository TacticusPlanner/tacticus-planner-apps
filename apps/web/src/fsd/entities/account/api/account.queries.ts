import { queryOptions } from "@tanstack/react-query"

import { getCurrentUser, getUserJotToken } from "./account.api"

export const accountQueries = {
  all: () => ["current-user"] as const,
  current: () =>
    queryOptions({
      queryKey: accountQueries.all(),
      queryFn: ({ signal }) => getCurrentUser(signal),
    }),
  // Never served from cache: the backend mints a fresh, short-lived token on every call, so a
  // stale one here would just hand the widget a token closer to expiry for no benefit.
  userJotToken: () =>
    queryOptions({
      queryKey: ["userjot-token"] as const,
      queryFn: ({ signal }) => getUserJotToken(signal),
      staleTime: 0,
      gcTime: 0,
    }),
}
