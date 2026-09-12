import { queryOptions } from "@tanstack/react-query"

import { getGuildRaidStatus } from "./guild-raid-status.api"

// Exported separately (rather than read off `guildRaidStatusQueries.current().queryKey`) so the
// mutation success handler in `useGuildRaidStatus` can target the same cache entry with
// `queryClient.setQueryData` using an explicit result type, untied from `queryOptions`' own inference.
export const guildRaidStatusQueryKey = ["guild-raid-status", "current"] as const

export const guildRaidStatusQueries = {
  current: () =>
    queryOptions({
      queryKey: guildRaidStatusQueryKey,
      queryFn: ({ signal }) => getGuildRaidStatus(signal),
    }),
}
