import { queryOptions } from "@tanstack/react-query"

import { authenticatedQueryKey } from "@/shared/api"

import { getMyGuild } from "./guild.api"

export const guildQueries = {
  current: (accountId: string) =>
    queryOptions({
      queryKey: [
        ...authenticatedQueryKey(accountId),
        "guild",
        "current",
      ] as const,
      queryFn: ({ signal }) => getMyGuild(signal),
    }),
}
