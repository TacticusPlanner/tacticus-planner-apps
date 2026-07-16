import { queryOptions } from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"

import { getCurrentUser } from "./account.api"

export const accountQueries = {
  all: (accountId: string) => [
    ...authenticatedQueryKey(accountId),
    "current-user",
  ],
  current: (accountId: string) =>
    queryOptions({
      queryKey: accountQueries.all(accountId),
      queryFn: ({ signal }) => getCurrentUser(signal),
    }),
}
