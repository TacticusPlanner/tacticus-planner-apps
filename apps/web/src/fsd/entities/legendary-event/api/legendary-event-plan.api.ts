import { apiClient, unwrap } from "@/shared/api"

import {
  toLegendaryEventPlan,
  toLegendaryEventRun,
  type CreateTeamRequestDto,
  type LegendaryEventRun,
  type UpdateAnnotationsRequestDto,
  type UpdatePlanRequestDto,
  type UpdateRunInputsRequestDto,
  type UpdateTeamOrderRequestDto,
  type UpdateTeamRequestDto,
} from "../model/plan.types"
import type {
  LegendaryEventPlanList,
  LegendaryEventRunRecords,
} from "../model/run-record.types"

/** The caller's plan for one event; a plan never written reads as an empty plan at revision 0. */
export async function getLegendaryEventPlan(
  eventId: string,
  signal?: AbortSignal
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().GET("/api/v1/legendary-event-plans/{eventId}", {
        params: { path: { eventId } },
        signal,
      })
    )
  )
}

/** Every plan stored for the caller (never an empty plan for an event without a row), including
 *  plans whose event has left the catalog. */
export async function listLegendaryEventPlans(
  signal?: AbortSignal
): Promise<LegendaryEventPlanList> {
  const { plans } = await unwrap(
    apiClient().GET("/api/v1/legendary-event-plans", { signal })
  )
  return { plans: plans.map(toLegendaryEventPlan) }
}

/** One page of the caller's run records of one event, newest first (`after` is the previous page's
 *  `nextAfter`); 404 when the id is neither a catalog event nor has any record. */
export async function getLegendaryEventRunRecords(
  eventId: string,
  options: { after?: string | null; limit?: number; signal?: AbortSignal } = {}
): Promise<LegendaryEventRunRecords> {
  const page = await unwrap(
    apiClient().GET("/api/v1/legendary-event-plans/{eventId}/run-records", {
      params: {
        path: { eventId },
        query: {
          limit: options.limit,
          after: options.after || undefined,
        },
      },
      signal: options.signal,
    })
  )
  return {
    ...page,
    records: page.records.map((record) => ({
      ...record,
      run: toLegendaryEventRun(record.run),
    })),
  }
}

/** The roster as it was at one record's last progress (ETag-cached by the API). */
export function getLegendaryEventRunRecordRoster(
  eventId: string,
  recordId: string,
  signal?: AbortSignal
) {
  return unwrap(
    apiClient().GET(
      "/api/v1/legendary-event-plans/{eventId}/run-records/{recordId}/roster",
      { params: { path: { eventId, recordId } }, signal }
    )
  )
}

// Every mutation carries `expectedRevision` and answers with the whole plan. A stale revision (or,
// for the order, a team id set that differs from the lane's) is a 409 whose body carries the
// current plan — see `legendaryEventPlanConflict`.

export async function updateLegendaryEventPlan(
  eventId: string,
  request: UpdatePlanRequestDto
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().PUT("/api/v1/legendary-event-plans/{eventId}", {
        params: { path: { eventId } },
        body: request,
      })
    )
  )
}

export async function createLegendaryEventTeam(
  eventId: string,
  request: CreateTeamRequestDto
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().POST("/api/v1/legendary-event-plans/{eventId}/teams", {
        params: { path: { eventId } },
        body: request,
      })
    )
  )
}

export async function updateLegendaryEventTeam(
  eventId: string,
  teamId: string,
  request: UpdateTeamRequestDto
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().PUT(
        "/api/v1/legendary-event-plans/{eventId}/teams/{teamId}",
        { params: { path: { eventId, teamId } }, body: request }
      )
    )
  )
}

export async function deleteLegendaryEventTeam(
  eventId: string,
  teamId: string,
  expectedRevision: number
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().DELETE(
        "/api/v1/legendary-event-plans/{eventId}/teams/{teamId}",
        {
          params: { path: { eventId, teamId }, query: { expectedRevision } },
        }
      )
    )
  )
}

export async function updateLegendaryEventTeamOrder(
  eventId: string,
  request: UpdateTeamOrderRequestDto
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().PUT("/api/v1/legendary-event-plans/{eventId}/teams/order", {
        params: { path: { eventId } },
        body: request,
      })
    )
  )
}

/** Upserts one run's inputs (missions, premium missions, bundle, Oh So Close shards). */
export async function updateLegendaryEventRunInputs(
  eventId: string,
  run: LegendaryEventRun,
  request: UpdateRunInputsRequestDto
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().PUT("/api/v1/legendary-event-plans/{eventId}/runs/{run}", {
        params: { path: { eventId, run: String(run) } },
        body: request,
      })
    )
  )
}

/** Sets or clears the Maybe clear / Stop here mark of the listed cells of one battle. */
export async function updateLegendaryEventAnnotations(
  eventId: string,
  request: UpdateAnnotationsRequestDto
) {
  return toLegendaryEventPlan(
    await unwrap(
      apiClient().PUT("/api/v1/legendary-event-plans/{eventId}/annotations", {
        params: { path: { eventId } },
        body: request,
      })
    )
  )
}
