import { apiIssue, type ApiSchemas } from "@/shared/api"

// `/api/v1/legendary-event-plans/{eventId}` (companion API changes add-legendary-event-teams, design
// D8, and add-legendary-event-run-inputs, design D2, D4, D6). Every endpoint answers with the whole
// plan. Wire shapes are generated from the API's OpenAPI document (spec: api-contract-sync); the
// response shapes only narrow `run` (a plain integer on the wire) to `LegendaryEventRun`, which
// `toLegendaryEventPlan` checks at runtime. Request and 409 bodies carry the `Dto` suffix.
type S = ApiSchemas

/** How a run's clear depth was set. This client only ever writes `manual` (Stage 2). */
export type LegendaryEventDepthSource = S["LegendaryEventDepthSource"]

/** An event run (1-3): the catalog has no run number, the client takes it from synced progress. */
export type LegendaryEventRun = 1 | 2 | 3

const LEGENDARY_EVENT_RUNS: readonly LegendaryEventRun[] = [1, 2, 3]

/** `run` as a `LegendaryEventRun`; any other value breaks the API contract and throws. */
export function toLegendaryEventRun(run: number): LegendaryEventRun {
  const narrowed = LEGENDARY_EVENT_RUNS.find((candidate) => candidate === run)
  if (narrowed === undefined) {
    throw new Error(`Unexpected Legendary Event run ${run}`)
  }
  return narrowed
}

/** A wire shape with its integer `run` narrowed. */
export type WithRun<T extends { run: number }> = Omit<T, "run"> & {
  run: LegendaryEventRun
}

/** One stored run's clear depth (`recordedAt`: the last write of it); runs without a depth are
 *  omitted from `runDepths`. */
export type LegendaryEventTeamRunDepth = WithRun<
  S["LegendaryEventTeamRunDepthResponse"]
>

/** `sortOrder` is dense, 0-based within the lane; `memberUnitIds` are member positions 0..4 in order
 *  (1-5 entries); `objectiveIndexes` the covered lane objective `index`es, ascending; `runDepths`
 *  ascending by run. */
export type LegendaryEventTeam = Omit<
  S["LegendaryEventTeamResponse"],
  "runDepths"
> & { runDepths: LegendaryEventTeamRunDepth[] }

/** One run's economy inputs the Tacticus API does not report; runs never written are omitted from
 *  `runs` and read as zeros. Mission counts are 0..the event's catalog count, `closeShards` ("Oh So
 *  Close") 0..75; `completed*Missions` are the catalog indexes ticked Done this run, ascending. */
export type LegendaryEventRunInputs = WithRun<
  S["LegendaryEventRunProgressResponse"]
>

/** The editable values of one run (what the drawer edits and the run write sends). The counts
 *  are the missions the run will complete (the forecast reads them), never below the ticks. */
export type LegendaryEventRunInputValues = Pick<
  LegendaryEventRunInputs,
  | "regularMissions"
  | "premiumMissions"
  | "bundlePurchased"
  | "closeShards"
  | "completedRegularMissions"
  | "completedPremiumMissions"
>

/** A Maybe clear / Stop here reminder on one objective cell of a battle. */
export type LegendaryEventAnnotationStatus = S["LegendaryEventAnnotationStatus"]

/**
 * One stored mark. Cell ids follow the synced `lre-progress` contract: `battleIndex` is the 0-based
 * `encounters` index, `objectiveId` 0 is defeat-all and 1-5 the objective with catalog `index`
 * `objectiveId - 1`. A mark applies only while sync shows its cell not cleared (see
 * `applicableAnnotations`); stale rows stay on the plan, ignored.
 */
export type LegendaryEventAnnotation =
  S["LegendaryEventObjectiveAnnotationResponse"]

/** `revision` is the plan-level concurrency token (0 for a plan that does not exist yet). `teams` are
 *  ordered by lane (alpha, beta, gamma) then `sortOrder`; `runs` ascending by run (absent runs
 *  omitted); `annotations` by lane, `battleIndex`, then `objectiveId`. */
export type LegendaryEventPlan = Omit<
  S["LegendaryEventPlanResponse"],
  "teams" | "runs"
> & { teams: LegendaryEventTeam[]; runs: LegendaryEventRunInputs[] }

/** The plan as the client keeps it, `run`s checked (see `toLegendaryEventRun`). */
export function toLegendaryEventPlan(
  plan: S["LegendaryEventPlanResponse"]
): LegendaryEventPlan {
  return {
    ...plan,
    teams: plan.teams.map((team) => ({
      ...team,
      runDepths: team.runDepths.map((depth) => ({
        ...depth,
        run: toLegendaryEventRun(depth.run),
      })),
    })),
    runs: plan.runs.map((run) => ({
      ...run,
      run: toLegendaryEventRun(run.run),
    })),
  }
}

export type UpdatePlanRequestDto = S["UpdateLegendaryEventPlanRequest"]

/** `PUT .../runs/{run}`: upserts one run's inputs; unchanged values keep the revision. */
export type UpdateRunInputsRequestDto =
  S["UpdateLegendaryEventRunInputsRequest"]

/** `PUT .../annotations`: sets (or clears, with null) the status of the listed cells of one battle
 *  (1-6 distinct cell ids: 0 defeat-all, 1-5 objective index + 1); unchanged cells keep the revision. */
export type UpdateAnnotationsRequestDto =
  S["UpdateLegendaryEventAnnotationsRequest"]

/** The team fields plus `laneId`; the depth applies to `run` only. */
export type CreateTeamRequestDto = S["CreateLegendaryEventTeamRequest"]

/** A team never changes lane: this client sends no `laneId` on an update. */
export type UpdateTeamRequestDto = S["UpdateLegendaryEventTeamRequest"]

/** `teamIds` is the lane's complete team id set in the new order. */
export type UpdateTeamOrderRequestDto =
  S["UpdateLegendaryEventTeamOrderRequest"]

export type LegendaryEventPlanConflictCode =
  "legendaryEventPlanStale" | "legendaryEventOrderSetMismatch"

/** The plan as it now stands when `error` is a plan 409 (stale revision, or a reorder whose ids are not
 *  the lane's team set), else null (a goal conflict, a validation failure, a body without a plan). */
export function legendaryEventPlanConflict(error: unknown): {
  issueCode: LegendaryEventPlanConflictCode
  current: LegendaryEventPlan
} | null {
  const issue = apiIssue(
    error,
    "legendaryEventPlanStale",
    "legendaryEventOrderSetMismatch"
  )
  const plan = issue?.current as
    Partial<S["LegendaryEventPlanResponse"]> | undefined
  return issue &&
    Array.isArray(plan?.teams) &&
    Array.isArray(plan.runs) &&
    typeof plan.revision === "number"
    ? {
        issueCode: issue.issueCode as LegendaryEventPlanConflictCode,
        current: toLegendaryEventPlan(plan as S["LegendaryEventPlanResponse"]),
      }
    : null
}
