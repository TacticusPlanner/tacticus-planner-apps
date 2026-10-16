import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/shared/api"

import type { LegendaryEventPlan } from "../model/plan.types"
import {
  getLegendaryEventPlan,
  getLegendaryEventRunRecords,
  listLegendaryEventPlans,
} from "./legendary-event-plan.api"

/** A fetched plan older than the cached one (a refetch that raced a write) never replaces it: the
 *  revision only grows, so the cache keeps the newer plan and the next write's `expectedRevision`. */
function newerLegendaryEventPlan(
  cached: LegendaryEventPlan | undefined,
  fetched: LegendaryEventPlan
): LegendaryEventPlan {
  return cached && cached.revision > fetched.revision ? cached : fetched
}

/** Fills the per-event plan cache from the list for events not read yet, so opening an event page
 *  after the master table starts from the listed plan. An entry already cached (possibly holding
 *  optimistic edits) is left to its own query. */
function seedPlanDetails(client: QueryClient, plans: LegendaryEventPlan[]) {
  for (const plan of plans) {
    const { queryKey } = legendaryEventPlanQueries.detail(plan.eventId)
    if (client.getQueryData(queryKey) === undefined) {
      client.setQueryData(queryKey, plan)
    }
  }
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
  // Under `all()` (so invalidating every plan covers the list too) but keyed by an object, which
  // no event id's detail key prefixes.
  list: () =>
    queryOptions({
      queryKey: [
        ...legendaryEventPlanQueries.all(),
        { scope: "list" },
      ] as const,
      queryFn: async ({ signal, client }) => {
        const { plans } = await listLegendaryEventPlans(signal)
        seedPlanDetails(client, plans)
        return plans
      },
    }),
  // Its own root: below a detail key it would be cancelled by every plan write of that event.
  runRecords: (eventId: string) =>
    queryOptions({
      queryKey: ["legendary-event-run-records", eventId] as const,
      queryFn: async ({ signal }) => {
        try {
          return (await getLegendaryEventRunRecords(eventId, signal)).records
        } catch (error) {
          // 404: neither a catalog event nor any record, so there is no history to show.
          if (error instanceof ApiError && error.status === 404) return []
          throw error
        }
      },
    }),
}
