import { queryOptions } from "@tanstack/react-query"

import { getCampaignEventProgressOverrides } from "./campaign-event-progress.api"

export const campaignEventProgressQueries = {
  all: () => ["player-data-overrides", "campaign-events"] as const,
  current: () =>
    queryOptions({
      queryKey: [...campaignEventProgressQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getCampaignEventProgressOverrides(signal),
      // Read on every planning surface (Today, Schedule, Home, Goals, Insights) through the shared
      // eligibility hook, but changed only by saving on the Progress page, which writes the saved
      // value into this cache. A stale copy from another device can't overwrite anything: saves
      // carry the base revision and get a 409.
      staleTime: 5 * 60 * 1000,
    }),
}
