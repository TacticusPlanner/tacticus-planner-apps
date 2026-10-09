import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type {
  CreateTeamRequestDto,
  LegendaryEventPlan,
  UpdatePlanRequestDto,
  UpdateTeamOrderRequestDto,
  UpdateTeamRequestDto,
} from "../model/plan.types"

const planPath = (eventId: string) =>
  `/api/v1/me/legendary-event-plans/${encodeURIComponent(eventId)}`

const teamPath = (eventId: string, teamId: string) =>
  `${planPath(eventId)}/teams/${encodeURIComponent(teamId)}`

/** The caller's plan for one event; a plan never written reads as an empty plan at revision 0. */
export function getLegendaryEventPlan(eventId: string, signal?: AbortSignal) {
  return apiGet<LegendaryEventPlan>(planPath(eventId), { signal })
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
