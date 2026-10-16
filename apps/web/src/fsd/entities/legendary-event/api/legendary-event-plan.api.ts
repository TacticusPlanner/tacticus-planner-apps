import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateTeamRequestDto,
  LegendaryEventPlan,
  LegendaryEventRun,
  UpdateAnnotationsRequestDto,
  UpdatePlanRequestDto,
  UpdateRunInputsRequestDto,
  UpdateTeamOrderRequestDto,
  UpdateTeamRequestDto,
} from "../model/plan.types"
import type {
  LegendaryEventPlanList,
  LegendaryEventRunRecords,
} from "../model/run-record.types"

const PLANS_PATH = "/api/v1/me/legendary-event-plans"

const planPath = (eventId: string) =>
  `${PLANS_PATH}/${encodeURIComponent(eventId)}`

const teamPath = (eventId: string, teamId: string) =>
  `${planPath(eventId)}/teams/${encodeURIComponent(teamId)}`

/** The caller's plan for one event; a plan never written reads as an empty plan at revision 0. */
export function getLegendaryEventPlan(eventId: string, signal?: AbortSignal) {
  return apiGet<LegendaryEventPlan>(planPath(eventId), { signal })
}

/** Every plan stored for the caller (never an empty plan for an event without a row), including
 *  plans whose event has left the catalog. */
export function listLegendaryEventPlans(signal?: AbortSignal) {
  return apiGet<LegendaryEventPlanList>(PLANS_PATH, { signal })
}

/** The caller's run records of one event, newest first; 404 when the id is neither a catalog event
 *  nor has any record. */
export function getLegendaryEventRunRecords(
  eventId: string,
  signal?: AbortSignal
) {
  return apiGet<LegendaryEventRunRecords>(`${planPath(eventId)}/run-records`, {
    signal,
  })
}

// Every mutation carries `expectedRevision` and answers with the whole plan. A stale revision (or,
// for the order, a team id set that differs from the lane's) is a 409 whose body carries the
// current plan — see `legendaryEventPlanConflictDetails`.

export function updateLegendaryEventPlan(
  eventId: string,
  request: UpdatePlanRequestDto
) {
  return apiPut<LegendaryEventPlan>(planPath(eventId), { body: request })
}

export function createLegendaryEventTeam(
  eventId: string,
  request: CreateTeamRequestDto
) {
  return apiPost<LegendaryEventPlan>(`${planPath(eventId)}/teams`, {
    body: request,
  })
}

export function updateLegendaryEventTeam(
  eventId: string,
  teamId: string,
  request: UpdateTeamRequestDto
) {
  return apiPut<LegendaryEventPlan>(teamPath(eventId, teamId), {
    body: request,
  })
}

export function deleteLegendaryEventTeam(
  eventId: string,
  teamId: string,
  expectedRevision: number
) {
  return apiDelete<LegendaryEventPlan>(
    `${teamPath(eventId, teamId)}?expectedRevision=${expectedRevision}`,
    {}
  )
}

export function updateLegendaryEventTeamOrder(
  eventId: string,
  request: UpdateTeamOrderRequestDto
) {
  return apiPut<LegendaryEventPlan>(`${planPath(eventId)}/teams/order`, {
    body: request,
  })
}

/** Upserts one run's inputs (missions, premium missions, bundle, Oh So Close shards). */
export function updateLegendaryEventRunInputs(
  eventId: string,
  run: LegendaryEventRun,
  request: UpdateRunInputsRequestDto
) {
  return apiPut<LegendaryEventPlan>(`${planPath(eventId)}/runs/${run}`, {
    body: request,
  })
}

/** Sets or clears the Maybe clear / Stop here mark of the listed cells of one battle. */
export function updateLegendaryEventAnnotations(
  eventId: string,
  request: UpdateAnnotationsRequestDto
) {
  return apiPut<LegendaryEventPlan>(`${planPath(eventId)}/annotations`, {
    body: request,
  })
}
