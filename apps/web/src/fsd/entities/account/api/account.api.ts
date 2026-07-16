import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api"

import type { CurrentUser } from "../model/current-user"

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

export function getCurrentUser(signal?: AbortSignal) {
  return apiGet<CurrentUser>("/api/v1/me", { signal })
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
  }
}

export type ImportPartResult = {
  status: "Imported" | "Skipped" | "Failed"
  code: string | null
  message: string | null
}

export type ImportV1ProfileResult = {
  tacticusUserId: ImportPartResult
  personalTacticusApiKey: ImportPartResult
  guildApiToken: ImportPartResult
  goals: ImportPartResult
  goalsImported: number
  goalsReplaced: number
  goalsSkipped: number
  goalIssues: { code: string; sourceGoalId: string | null; message: string }[]
}

export function importV1Profile(request: ImportV1ProfileRequest) {
  return apiPost<ImportV1ProfileResult>("/api/v1/me/v1-import", {
    body: request,
  })
}

export async function purgeAccount() {
  await apiDelete("/api/v1/me", {})
}
