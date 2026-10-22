import {
  infiniteQueryOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query"

import { ApiError } from "@/shared/api"

import type { LegendaryEventPlan } from "../model/plan.types"
import type { LegendaryEventRunRecords } from "../model/run-record.types"
import {
  getLegendaryEventPlan,
  getLegendaryEventRunRecordRoster,
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
  // Invalidating `runRecordsAll()` refreshes every event's records (a sync can create one).
  runRecordsAll: () => ["legendary-event-run-records"] as const,
  // Pages of records, newest first; each page's `nextAfter` is the next (older) page's cursor.
  runRecords: (eventId: string) =>
    infiniteQueryOptions({
      queryKey: [
        ...legendaryEventPlanQueries.runRecordsAll(),
        eventId,
      ] as const,
      initialPageParam: null as string | null,
      getNextPageParam: (page: LegendaryEventRunRecords) =>
        page.nextAfter ?? undefined,
      queryFn: async ({
        signal,
        pageParam,
      }): Promise<LegendaryEventRunRecords> => {
        try {
          return await getLegendaryEventRunRecords(eventId, {
            after: pageParam,
            signal,
          })
        } catch (error) {
          // 404: neither a catalog event nor any record, so there is no history to show.
          if (error instanceof ApiError && error.status === 404) {
            return { eventId, records: [], nextAfter: null }
          }
          throw error
        }
      },
    }),
  // Under the event's records key, so refreshing the records (a sync) refreshes the rosters too.
  runRecordRoster: (eventId: string, recordId: string) =>
    queryOptions({
      queryKey: [
        ...legendaryEventPlanQueries.runRecordsAll(),
        eventId,
        "roster",
        recordId,
      ] as const,
      queryFn: ({ signal }) =>
        getLegendaryEventRunRecordRoster(eventId, recordId, signal),
    }),
}
