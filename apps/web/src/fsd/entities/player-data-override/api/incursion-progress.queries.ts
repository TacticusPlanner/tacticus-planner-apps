import { queryOptions } from "@tanstack/react-query"

import { playerDataOverrideKey } from "./player-data-override.queries"

import { getIncursionProgressOverrides } from "./incursion-progress.api"

export const incursionProgressQueries = {
  all: () => [...playerDataOverrideKey, "incursions-progress"] as const,
  current: () =>
    queryOptions({
      queryKey: [...incursionProgressQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getIncursionProgressOverrides(signal),
      // Read and changed only by the Incursions page, which saves through a revisioned draft. The
      // revision is shared with the other overrides, so saving any of them refreshes this query.
    }),
}
