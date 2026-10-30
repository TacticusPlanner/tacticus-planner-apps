import { apiClient, unwrap, type ApiSchemas } from "@/shared/api"

import type { CurrentUser } from "../model/current-user"
import { mapCurrentUserDtoToDomain } from "../model/current-user.mapper"
import { clearSetupCompleteHint } from "../model/setup-complete-hint"

// Wire shapes, generated from the API's OpenAPI document (spec: api-contract-sync); never hand-written.
type S = ApiSchemas

/** A null key or user id leaves the stored one unchanged; `clearTacticusUserId` removes the user id. */
type UpdateTacticusIntegrationRequest = S["UpdateTacticusIntegrationRequest"]

export type TacticusIntegrationResult = S["UpdateTacticusIntegrationResponse"]

export async function getCurrentUser(
  signal?: AbortSignal
): Promise<CurrentUser> {
  return mapCurrentUserDtoToDomain(
    await unwrap(apiClient().GET("/api/v1/account", { signal }))
  )
}

export function updateDisplayName(displayName: string) {
  return unwrap(
    apiClient().PUT("/api/v1/account/display-name", { body: { displayName } })
  )
}

export function getUserJotToken(signal?: AbortSignal) {
  return unwrap(apiClient().GET("/api/v1/userjot-token", { signal }))
}

export function updateTacticusIntegration(
  request: UpdateTacticusIntegrationRequest
) {
  return unwrap(
    apiClient().PUT("/api/v1/account/tacticus-integration", { body: request })
  )
}

/** `import.legendaryEventPlans` imports V1 Legendary Event teams and notes (one plan per known event,
 *  never replacing a plan that already has teams); `import.automaticPrerequisites` synthesizes missing
 *  Unlock/Ascension prerequisites for an imported goal (same rules as the manual create-goal flow) —
 *  sent explicitly so clearing the option in the dialog is honoured. */
export type ImportV1ProfileRequest = S["ImportV1ProfileRequest"]

export type ImportPartResult = S["ImportPartResult"]

/** One outcome per source V1 goal, plus one per automatically added prerequisite — the import creates
 *  goals itself. `code` is a stable machine-readable discriminator (e.g. "goal_created",
 *  "unknown_unit") the client buckets on; `message` is a server-composed, already-readable sentence
 *  rendered as-is. A V1 material goal's outcome carries its `upgradeId`; its manual step
 *  ("manual_step_required") also carries the suggested unit, an upgrade-material goal's
 *  `upgradeQuantity`, and a pre-farm goal's `linkedSourceGoalIds` (the V1 goals it pre-farmed for). */
export type V1GoalOutcome = S["V1GoalOutcome"]

/** One dropped unit, objective or team, or a merge, or a run input or mark issue, under the V1 event it
 *  happened in. `value` is the V1 value concerned (the unknown unit id, the discarded depth, a clamped
 *  run input as `run:field:original`, a skipped mark as `lane:battleIndex` or `lane:objective`, a kept
 *  count, ...); run input and mark issues carry no `teamName`. */
export type V1LegendaryEventIssue = S["V1LegendaryEventIssue"]

/** One outcome per V1 event of the `legendaryEventPlans` part. `eventId` is the catalog event id (null
 *  when the planner does not know the event); `v1EventId` the V1 numeric event key. `code` is the
 *  bucketing discriminator ("imported", "inputs_imported", "plan_already_exists",
 *  "event_not_in_catalog", "legendary_event_import_failed"); `message` is server English, never
 *  rendered. `runInputsImported` / `annotationsImported` count the run rows and marks written. */
export type V1LegendaryEventOutcome = S["V1LegendaryEventOutcome"]

/** `suggestedDisplayName` is the V1 login username as a private prefill for the name step — only while
 *  the account has no confirmed name. Never public identity, and not stored by the API. */
export type ImportV1ProfileResult = S["ImportV1ProfileResponse"]

export function importV1Profile(request: ImportV1ProfileRequest) {
  return unwrap(
    apiClient().POST("/api/v1/account/v1-import", { body: request })
  )
}

/** `deleteSignInAccount` also deletes the Entra External ID user the caller signs in with; otherwise only
 *  planner data goes and the same sign-in starts a fresh planner account. Resolves whether the sign-in
 *  account is actually gone (the `X-Sign-In-Account-Deleted` header): that step is best effort, so it
 *  can be false even when asked for, while the planner data is deleted either way. */
export async function purgeAccount({
  deleteSignInAccount = false,
}: { deleteSignInAccount?: boolean } = {}): Promise<{
  signInAccountDeleted: boolean
}> {
  const { response } = await apiClient().DELETE("/api/v1/account", {
    params: { query: { deleteSignInAccount } },
  })
  // The account is gone, so the next sign-in must wait for GET /account to provision a new one.
  clearSetupCompleteHint()
  return {
    signInAccountDeleted:
      response.headers.get("X-Sign-In-Account-Deleted") === "true",
  }
}
