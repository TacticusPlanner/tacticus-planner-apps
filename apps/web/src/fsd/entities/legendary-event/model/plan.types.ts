import type { LegendaryEventLaneId } from "./types"

// Hand-written DTOs for `/api/v1/me/legendary-event-plans/{eventId}` (companion API change
// add-legendary-event-teams, design D8). Every endpoint answers with the whole plan.

/** How a run's clear depth was set. This client only ever writes `manual` (Stage 2). */
export type LegendaryEventDepthSource = "estimate" | "manual"

/** An event run (1–3): the catalog has no run number, the client takes it from synced progress. */
export type LegendaryEventRun = 1 | 2 | 3

/** One stored run's clear depth; runs without a depth are omitted from `runDepths`. */
export interface LegendaryEventTeamRunDepth {
  run: LegendaryEventRun
  expectedBattleClears: number
  expectedBattleClearsSource: LegendaryEventDepthSource
  /** ISO 8601 UTC: the last write of this run's depth. */
  recordedAt: string
}

export interface LegendaryEventTeam {
  id: string
  laneId: LegendaryEventLaneId
  name: string
  /** Dense, 0-based within the lane. */
  sortOrder: number
  /** Member positions 0..4 in order (1–5 entries). */
  memberUnitIds: string[]
  reserveUnitId: string | null
  /** Covered lane objective `index`es, ascending. */
  objectiveIndexes: number[]
  /** Ascending by run. */
  runDepths: LegendaryEventTeamRunDepth[]
}

export interface LegendaryEventPlan {
  eventId: string
  /** The plan-level concurrency token; 0 for a plan that does not exist yet. */
  revision: number
  catalogVersion: string
  notes: string | null
  showPaidOptions: boolean
  /** Ordered by lane (alpha, beta, gamma) then `sortOrder`. */
  teams: LegendaryEventTeam[]
}

export interface UpdatePlanRequest {
  expectedRevision: number
  notes: string | null
  showPaidOptions: boolean
}

/** The team fields a create and an update share; the depth applies to `run` only. */
interface TeamFields {
  expectedRevision: number
  name: string
  memberUnitIds: string[]
  reserveUnitId: string | null
  objectiveIndexes: number[]
  run: LegendaryEventRun
  expectedBattleClears: number | null
  expectedBattleClearsSource: LegendaryEventDepthSource | null
}

export type CreateTeamRequest = TeamFields & { laneId: LegendaryEventLaneId }

/** A team never changes lane: the update body carries no `laneId`. */
export type UpdateTeamRequest = TeamFields

export interface UpdateTeamOrderRequest {
  expectedRevision: number
  laneId: LegendaryEventLaneId
  /** The lane's complete team id set in the new order. */
  teamIds: string[]
}

export type LegendaryEventPlanConflictCode =
  "legendaryEventPlanStale" | "legendaryEventOrderSetMismatch"

/** The 409 body of every plan mutation: the current plan to adopt. */
export interface LegendaryEventPlanConflictDto {
  issueCode: LegendaryEventPlanConflictCode
  message: string
  plan: LegendaryEventPlan
}

const CONFLICT_CODES: readonly string[] = [
  "legendaryEventPlanStale",
  "legendaryEventOrderSetMismatch",
] satisfies LegendaryEventPlanConflictCode[]

/** Narrows an `ApiError.details` body to a plan 409, or null for any other error (a goal conflict,
 *  a validation failure, a body without a plan). */
export function legendaryEventPlanConflictDetails(
  details: unknown
): LegendaryEventPlanConflictDto | null {
  if (!details || typeof details !== "object") return null
  const value = details as Partial<LegendaryEventPlanConflictDto>
  return typeof value.issueCode === "string" &&
    CONFLICT_CODES.includes(value.issueCode) &&
    typeof value.message === "string" &&
    !!value.plan &&
    typeof value.plan === "object" &&
    Array.isArray(value.plan.teams) &&
    typeof value.plan.revision === "number"
    ? (value as LegendaryEventPlanConflictDto)
    : null
}
