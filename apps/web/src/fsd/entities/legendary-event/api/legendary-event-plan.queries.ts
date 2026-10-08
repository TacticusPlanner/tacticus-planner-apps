import { queryOptions } from "@tanstack/react-query"

import { getLegendaryEventPlan } from "./legendary-event-plan.api"

export const legendaryEventPlanQueries = {
  all: () => ["legendary-event-plans"] as const,
  detail: (eventId: string) =>
    queryOptions({
      queryKey: [...legendaryEventPlanQueries.all(), eventId] as const,
      queryFn: ({ signal }) => getLegendaryEventPlan(eventId, signal),
    }),
}
