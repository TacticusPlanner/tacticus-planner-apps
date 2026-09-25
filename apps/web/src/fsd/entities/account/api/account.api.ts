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

type TacticusIntegrationResult = {
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

export type ImportV1ProfileResult = {
  tacticusUserId: ImportPartResult
  personalTacticusApiKey: ImportPartResult
  guildApiToken: ImportPartResult
  onslaughtProgress: ImportPartResult
  campaignEventProgress: ImportPartResult
  goals: ImportPartResult
  outcomes: V1GoalOutcome[]
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
