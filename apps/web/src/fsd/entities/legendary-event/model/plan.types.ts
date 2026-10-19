import type { LegendaryEventLaneId } from "./types"

// Hand-written types for `/api/v1/me/legendary-event-plans/{eventId}` (companion API changes
// add-legendary-event-teams, design D8, and add-legendary-event-run-inputs, design D2, D4, D6). Every endpoint answers with the whole plan. The request
// and 409 bodies exist only on the wire, so they carry the `Dto` suffix; the plan, team and run
// depth are read and written as-is by the feature, so they are the (unsuffixed) domain shape too.

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

/** One run's economy inputs the Tacticus API does not report; runs never written are omitted from
 *  `runs` and read as zeros. */
export interface LegendaryEventRunInputs {
  run: LegendaryEventRun
  /** 0..the event's catalog regular mission count. */
  regularMissions: number
  /** 0..the event's catalog premium mission count. */
  premiumMissions: number
  /** The 300-currency bundle was bought this run. */
  bundlePurchased: boolean
  /** "Oh So Close" shards, 0..75. */
  closeShards: number
  /** Catalog indexes of the regular missions ticked Done this run, ascending. Optional: a plan
   *  served before mission tracking (or built by an older test) has none. */
  completedRegularMissions?: number[]
  /** Catalog indexes of the premium missions ticked Done this run, ascending. */
  completedPremiumMissions?: number[]
  /** ISO 8601 UTC: the last write of this run. */
  updatedAt: string
}

/** The editable values of one run (what the drawer edits and the run write sends). The counts
 *  are the missions the run will complete (the forecast reads them), never below the ticks. */
export type LegendaryEventRunInputValues = Pick<
  LegendaryEventRunInputs,
  "regularMissions" | "premiumMissions" | "bundlePurchased" | "closeShards"
> & {
  completedRegularMissions: number[]
  completedPremiumMissions: number[]
}

/** A Maybe clear / Stop here reminder on one objective cell of a battle. */
export type LegendaryEventAnnotationStatus = "maybeClear" | "stopHere"

/**
 * One stored mark. Cell ids follow the synced `lre-progress` contract: `battleIndex` is the 0-based
 * `encounters` index, `objectiveId` 0 is defeat-all and 1–5 the objective with catalog `index`
 * `objectiveId − 1`. A mark applies only while sync shows its cell not cleared (see
 * `applicableAnnotations`); stale rows stay on the plan, ignored.
 */
export interface LegendaryEventAnnotation {
  laneId: LegendaryEventLaneId
  battleIndex: number
  objectiveId: number
  status: LegendaryEventAnnotationStatus
  updatedAt: string
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
  /** Ascending by run; absent runs omitted. Optional: a plan served before the run inputs change
   *  (or built by an older test) has none, which reads as no inputs. */
  runs?: LegendaryEventRunInputs[]
  /** Ordered by lane, `battleIndex`, then `objectiveId`. Optional like `runs`. */
  annotations?: LegendaryEventAnnotation[]
}

export interface UpdatePlanRequestDto {
  expectedRevision: number
  notes: string | null
  showPaidOptions: boolean
}

/** `PUT …/runs/{run}`: upserts one run's inputs; unchanged values keep the revision. */
export type UpdateRunInputsRequestDto = LegendaryEventRunInputValues & {
  expectedRevision: number
}

/** `PUT …/annotations`: sets (or clears, with null) the status of the listed cells of one battle;
 *  unchanged cells keep the revision. */
export interface UpdateAnnotationsRequestDto {
  expectedRevision: number
  laneId: LegendaryEventLaneId
  battleIndex: number
  /** 1–6 distinct cell ids (0 defeat-all, 1–5 objective index + 1). */
  objectiveIds: number[]
  status: LegendaryEventAnnotationStatus | null
}

/** The team fields a create and an update share; the depth applies to `run` only. */
interface TeamFieldsDto {
  expectedRevision: number
  name: string
  memberUnitIds: string[]
  reserveUnitId: string | null
  objectiveIndexes: number[]
  run: LegendaryEventRun
  expectedBattleClears: number | null
  expectedBattleClearsSource: LegendaryEventDepthSource | null
}

export type CreateTeamRequestDto = TeamFieldsDto & {
  laneId: LegendaryEventLaneId
}

/** A team never changes lane: the update body carries no `laneId`. */
export type UpdateTeamRequestDto = TeamFieldsDto

export interface UpdateTeamOrderRequestDto {
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
