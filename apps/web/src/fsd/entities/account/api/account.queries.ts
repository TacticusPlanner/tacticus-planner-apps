import { queryOptions } from "@tanstack/react-query"

import { isTransientApiError } from "@/shared/api"

import { getCurrentUser, getUserJotToken } from "./account.api"

const CURRENT_USER_RETRY_LIMIT = 3

export const accountQueries = {
  all: () => ["current-user"] as const,
  // The only query that opts out of the client-wide `retry: false`: it gates every protected route,
  // and a single failed call during an API rollout would otherwise park the user on the account
  // gate's error card (spec: onboarding-gate, transient failures retry before an error is shown).
  current: () =>
    queryOptions({
      queryKey: accountQueries.all(),
      queryFn: ({ signal }) => getCurrentUser(signal),
      retry: (failureCount, error) =>
        failureCount < CURRENT_USER_RETRY_LIMIT && isTransientApiError(error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
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
