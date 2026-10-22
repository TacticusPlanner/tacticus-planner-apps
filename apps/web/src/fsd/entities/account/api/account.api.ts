import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type { CurrentUser } from "../model/current-user"
import {
  mapCurrentUserDtoToDomain,
  type CurrentUserDto,
} from "../model/current-user.mapper"

type UpdateTacticusIntegrationRequest = {
  tacticusApiKey?: string
  tacticusUserId?: string
  clearTacticusUserId?: boolean
}

export type TacticusIntegrationResult = {
  profileId: string
  tacticusUserIdConfigured: boolean
  tacticusApiKeyConfigured: boolean
  playerName: string | null
  powerLevel: number | null
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
}

export async function getCurrentUser(
  signal?: AbortSignal
): Promise<CurrentUser> {
  return mapCurrentUserDtoToDomain(
    await apiGet<CurrentUserDto>("/api/v1/me", { signal })
  )
}

export function updateDisplayName(displayName: string) {
  return apiPut<{ displayName: string }>("/api/v1/me/display-name", {
    body: { displayName },
  })
}

export function getUserJotToken(signal?: AbortSignal) {
  return apiGet<{ token: string }>("/api/v1/me/userjot-token", { signal })
}

export function updateTacticusIntegration(
  request: UpdateTacticusIntegrationRequest
) {
  return apiPut<TacticusIntegrationResult>("/api/v1/me/tacticus-integration", {
    body: request,
  })
}

export type ImportV1ProfileRequest = {
  username: string
  password: string
  import: {
    personalTacticusApiKey: boolean
    tacticusUserId: boolean
    guildApiToken: boolean
    goals: boolean
    onslaughtProgress: boolean
    campaignEventProgress: boolean
    // V1 Legendary Event teams and notes (add-legendary-event-teams): one plan per known event,
    // never replacing a plan that already has teams.
    legendaryEventPlans: boolean
    // Auto-synthesize missing Unlock/Ascension prerequisites for an imported goal, same rules
    // and defaults as the manual create-goal flow (rewrite-v1-goal-import). Defaults true server-side
    // too, but sent explicitly so clearing the option in the dialog is honoured.
    automaticPrerequisites: boolean
  }
}

export type ImportPartResult = {
  status: "Imported" | "Skipped" | "Failed"
  code: string | null
  message: string | null
}

// One outcome per source V1 goal, plus one per automatically added prerequisite — the import
// creates goals itself now (rewrite-v1-goal-import); nothing is returned for the client to submit.
// `code` is a stable machine-readable discriminator (e.g. "goal_created", "unknown_unit") the client
// buckets on; `message` is a server-composed, already-readable sentence rendered as-is.
export type V1GoalOutcome = {
  status: "Created" | "Skipped" | "Failed"
  code: string
  message: string
  entityType: string | null
  entityId: string | null
  goalType: string | null
  goalId: string | null
  sourceGoalId: string | null
}

// One dropped unit, objective or team, or a merge, or a run input or mark issue, under the V1 event
// it happened in. `value` is the V1 value concerned (the unknown unit id, the discarded depth, a
// clamped run input as `run:field:original`, a skipped mark as `lane:battleIndex` or
// `lane:objective`, a kept count, ...); run input and mark issues carry no `teamName`.
export type V1LegendaryEventIssue = {
  code: string
  teamName: string | null
  value: string | null
}

// One outcome per V1 event of the `legendaryEventPlans` part. `eventId` is the catalog event id
// (null when the planner does not know the event); `v1EventId` the V1 numeric event key. `code` is
// the bucketing discriminator ("imported", "inputs_imported", "plan_already_exists",
// "event_not_in_catalog", "legendary_event_import_failed"); `message` is server English, never
// rendered. `runInputsImported` / `annotationsImported` count the run rows and marks written.
export type V1LegendaryEventOutcome = {
  eventId: string | null
  v1EventId: number
  status: "Imported" | "Skipped" | "Failed"
  code: string
  message: string
  teamsImported: number
  runInputsImported: number
  annotationsImported: number
  issues: V1LegendaryEventIssue[]
}

export type ImportV1ProfileResult = {
  tacticusUserId: ImportPartResult
  personalTacticusApiKey: ImportPartResult
  guildApiToken: ImportPartResult
  onslaughtProgress: ImportPartResult
  campaignEventProgress: ImportPartResult
  goals: ImportPartResult
  outcomes: V1GoalOutcome[]
  legendaryEventPlans: ImportPartResult
  legendaryEventOutcomes: V1LegendaryEventOutcome[]
  // The V1 login username as a private prefill for the name step — only while the account has no
  // confirmed name. Never public identity, and not stored by the API.
  suggestedDisplayName?: string | null
}

export function importV1Profile(request: ImportV1ProfileRequest) {
  return apiPost<ImportV1ProfileResult>("/api/v1/me/v1-import", {
    body: request,
  })
}

export async function purgeAccount() {
  await apiDelete("/api/v1/me", {})
}
