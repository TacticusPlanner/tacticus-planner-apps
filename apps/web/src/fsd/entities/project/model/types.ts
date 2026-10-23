import type { ApiSchemas } from "@/shared/api"

// Wire shapes, generated from the API's OpenAPI document (spec: api-contract-sync); never hand-written.
type S = ApiSchemas

/** What a project relates to (project-event-target); `eventId` is a catalog `lres` id. */
export type ProjectTarget = S["ProjectTargetDto"]

/** `target` is null when the project relates to nothing. `goalIds` are the member goals in global
 *  order, under the same archived selector as the goals list (non-archived goals by default); the only
 *  membership read, so no per-project request exists. */
export type ProjectSummary = S["ProjectSummaryResponse"]

export type CreateProjectRequest = S["CreateProjectRequest"]

/** Absent or null `target` clears it; archiving and restoring must resend it. */
export type UpdateProjectRequest = S["UpdateProjectRequest"]

/** `PUT /projects/{id}/goals`: `goals` is the complete desired membership (goal ids only — membership
 *  never changes the account-wide order) and `expectedGoalIds` the complete membership the user
 *  reviewed — the server rejects the whole save (409 `membershipStale`) when the current membership no
 *  longer matches it. */
export type UpdateProjectGoalsRequest = S["UpdateProjectGoalsRequest"]

/** Moves `goalId` to the global position `displacedGoalId` holds (both in-flight members of the
 * project); goals between them shift one place toward the vacated slot. */
export type MoveProjectGoalRequest = S["UpdateProjectGoalOrderRequest"]
