import { queryOptions } from "@tanstack/react-query"

import { getCampaignEventProgressOverrides } from "./campaign-event-progress.api"

export const campaignEventProgressQueries = {
  all: () => ["player-data-overrides", "campaign-events"] as const,
  current: () =>
    queryOptions({
      queryKey: [...campaignEventProgressQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getCampaignEventProgressOverrides(signal),
    }),
}
