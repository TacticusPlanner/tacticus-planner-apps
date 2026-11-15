import { queryOptions } from "@tanstack/react-query"

import type { EventShopPlan } from "../model/plan.types"
import { getEventShopPlan, listEventShopPlans } from "./event-shop-plan.api"

/** A fetched plan older than the cached one (a refetch that raced a write) never replaces it: the
 *  revision only grows, so the cache keeps the newer plan and the next write's `expectedRevision`. */
function newerEventShopPlan(
  cached: EventShopPlan | undefined,
  fetched: EventShopPlan
): EventShopPlan {
  return cached && cached.revision > fetched.revision ? cached : fetched
}

export const eventShopPlanQueries = {
  all: () => ["event-shop-plans"] as const,
  detail: (eventId: string) =>
    queryOptions({
      queryKey: [...eventShopPlanQueries.all(), eventId] as const,
      queryFn: async ({ signal, client, queryKey }) =>
        newerEventShopPlan(
          client.getQueryData<EventShopPlan>(queryKey),
          await getEventShopPlan(eventId, signal)
        ),
    }),
  // Under `all()` but keyed by an object, which no event id's detail key prefixes.
  list: () =>
    queryOptions({
      queryKey: [...eventShopPlanQueries.all(), { scope: "list" }] as const,
      queryFn: ({ signal }) => listEventShopPlans(signal),
    }),
}
