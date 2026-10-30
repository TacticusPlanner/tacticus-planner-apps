import { queryOptions } from "@tanstack/react-query"

import { getBattleProgressOverrides } from "./battle-progress.api"

export const battleProgressQueries = {
  all: () => ["player-data-overrides", "battle-progress"] as const,
  current: () =>
    queryOptions({
      queryKey: [...battleProgressQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getBattleProgressOverrides(signal),
      // Read by the shared eligibility hook on every planning surface, changed only by the battle
      // progress dialog, which writes the saved value into this cache. Saves carry the base
      // revision, so a stale copy from another device gets a 409 instead of overwriting.
    }),
}
