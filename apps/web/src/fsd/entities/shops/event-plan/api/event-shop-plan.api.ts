import { apiClient, unwrap } from "@/shared/api"

import {
  toEventShopPlan,
  type EventShopPlan,
  type PutEventShopPlanRequestDto,
} from "../model/plan.types"

/** The caller's plan for one event shop; a plan never written reads as revision 0 with no entries. */
export async function getEventShopPlan(
  eventId: string,
  signal?: AbortSignal
): Promise<EventShopPlan> {
  return toEventShopPlan(
    await unwrap(
      apiClient().GET("/api/v1/event-shop-plans/{eventId}", {
        params: { path: { eventId } },
        signal,
      })
    )
  )
}

/** Every stored plan of the caller, including plans whose event left the catalog. */
export async function listEventShopPlans(
  signal?: AbortSignal
): Promise<EventShopPlan[]> {
  const { plans } = await unwrap(
    apiClient().GET("/api/v1/event-shop-plans", { signal })
  )
  return plans.map(toEventShopPlan)
}

/** Replaces the whole cart. A stale `expectedRevision` is a 409 carrying the current plan — see
 *  `eventShopPlanConflict`. */
export async function putEventShopPlan(
  eventId: string,
  request: PutEventShopPlanRequestDto
): Promise<EventShopPlan> {
  return toEventShopPlan(
    await unwrap(
      apiClient().PUT("/api/v1/event-shop-plans/{eventId}", {
        params: { path: { eventId } },
        body: request,
      })
    )
  )
}
