import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { putEventShopPlan } from "../api/event-shop-plan.api"
import { eventShopPlanQueries } from "../api/event-shop-plan.queries"
import {
  toPutEventShopPlanRequest,
  type EventShopCartEntry,
} from "./plan.types"

/** The caller's stored plan for one event shop (revision 0 and no entries when never written). */
export function useEventShopPlan(eventId: string) {
  return useQuery(eventShopPlanQueries.detail(eventId))
}

/** Replaces the cart; a successful write becomes the cached plan. A 409 rejects with the `ApiError`
 *  whose `current` plan `eventShopPlanConflict` reads. */
export function useSaveEventShopPlan(eventId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      expectedRevision,
      entries,
    }: {
      expectedRevision: number
      entries: readonly EventShopCartEntry[]
    }) =>
      putEventShopPlan(
        eventId,
        toPutEventShopPlanRequest(expectedRevision, entries)
      ),
    onSuccess: (plan) => {
      client.setQueryData(eventShopPlanQueries.detail(eventId).queryKey, plan)
    },
  })
}
