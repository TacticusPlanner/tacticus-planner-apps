import { queryOptions } from "@tanstack/react-query"

import { getMyGuild } from "./guild.api"

export const guildQueries = {
  current: () =>
    queryOptions({
      queryKey: ["guild", "current"] as const,
      queryFn: ({ signal }) => getMyGuild(signal),
    }),
}
