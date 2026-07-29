import { queryOptions } from "@tanstack/react-query"

import { getCurrentUser } from "./account.api"

export const accountQueries = {
  all: () => ["current-user"] as const,
  current: () =>
    queryOptions({
      queryKey: accountQueries.all(),
      queryFn: ({ signal }) => getCurrentUser(signal),
    }),
}
