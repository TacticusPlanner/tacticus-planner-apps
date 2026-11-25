import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"

import { getCurrentWar, listPastWars } from "./guild-war.api"

/** The war query keys; `all()` covers both, so an import can refresh them. */
const guildWarKeys = {
  all: () => ["guild-wars"] as const,
  current: () => [...guildWarKeys.all(), { scope: "current" }] as const,
  past: () => [...guildWarKeys.all(), { scope: "past" }] as const,
}

export const guildWarQueries = {
  all: guildWarKeys.all,
  current: () =>
    queryOptions({
      queryKey: guildWarKeys.current(),
      queryFn: ({ signal }) => getCurrentWar(signal),
    }),
  // Pages of ended wars, newest first; each page's `nextAfter` is the next (older) page's cursor.
  past: () =>
    infiniteQueryOptions({
      queryKey: guildWarKeys.past(),
      initialPageParam: null as string | null,
      queryFn: ({ pageParam, signal }) => listPastWars(pageParam, signal),
      getNextPageParam: (page) => page.nextAfter,
    }),
}
