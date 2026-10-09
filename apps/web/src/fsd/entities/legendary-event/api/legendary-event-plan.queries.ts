import { queryOptions } from "@tanstack/react-query"

import type { LegendaryEventPlan } from "../model/plan.types"
import { getLegendaryEventPlan } from "./legendary-event-plan.api"

/** A fetched plan older than the cached one (a refetch that raced a write) never replaces it: the
 *  revision only grows, so the cache keeps the newer plan and the next write's `expectedRevision`. */
function newerLegendaryEventPlan(
  cached: LegendaryEventPlan | undefined,
  fetched: LegendaryEventPlan
): LegendaryEventPlan {
  return cached && cached.revision > fetched.revision ? cached : fetched
}

export const legendaryEventPlanQueries = {
  all: () => ["legendary-event-plans"] as const,
  detail: (eventId: string) =>
    queryOptions({
      queryKey: [...legendaryEventPlanQueries.all(), eventId] as const,
      queryFn: async ({ signal, client, queryKey }) =>
        newerLegendaryEventPlan(
          client.getQueryData<LegendaryEventPlan>(queryKey),
          await getLegendaryEventPlan(eventId, signal)
        ),
    }),
}
